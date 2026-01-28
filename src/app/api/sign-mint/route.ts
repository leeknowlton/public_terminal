import { NextResponse } from 'next/server';
import { keccak256, toBytes, encodePacked, recoverMessageAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getNeynarClient } from '~/lib/neynar';
import { MAX_MESSAGE_LENGTH, MAX_USERNAME_LENGTH } from '~/lib/contractABI';

/**
 * Generate mint signature for PUBLIC_TERMINAL contract
 *
 * This endpoint generates a signature server-side after verifying FID ownership.
 * The signature is created from: keccak256(abi.encodePacked(fid, username, text, walletAddress))
 *
 * Request body:
 * - fid: number - The Farcaster FID
 * - username: string - The Farcaster username
 * - text: string - The message text to mint (max 280 chars)
 * - address: string - The wallet address to mint from (message sender)
 *
 * Response:
 * - signature: string - The signature
 * - messageHash: string - The message hash that was signed
 * - signerAddress: string - The address that signed the message
 */
export async function POST(request: Request) {
  try {
    const signingPrivateKey = process.env.MINT_SIGNER_PRIVATE_KEY;

    if (!signingPrivateKey) {
      return NextResponse.json(
        { error: 'MINT_SIGNER_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fid, username, text, address } = body;

    // Validate FID
    if (typeof fid !== 'number' || fid <= 0 || !Number.isInteger(fid)) {
      return NextResponse.json(
        { error: 'Invalid fid: must be a positive integer' },
        { status: 400 }
      );
    }

    // Validate username
    if (typeof username !== 'string' || !username.trim()) {
      return NextResponse.json(
        { error: 'Invalid username: must be a non-empty string' },
        { status: 400 }
      );
    }

    if (username.length === 0 || username.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json(
        { error: `Invalid username: must be between 1 and ${MAX_USERNAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate text
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Invalid text: must be a non-empty string' },
        { status: 400 }
      );
    }

    if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Invalid text: must be between 1 and ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate address
    if (typeof address !== 'string' || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid address: must be a valid Ethereum address' },
        { status: 400 }
      );
    }

    // Verify FID ownership via Neynar
    try {
      const neynar = getNeynarClient();
      const response = await neynar.fetchBulkUsers({ fids: [fid] });

      if (!response.users || response.users.length === 0) {
        return NextResponse.json(
          { error: 'FID not found' },
          { status: 400 }
        );
      }

      const user = response.users[0];

      // Verify username matches
      if (user.username.toLowerCase() !== username.toLowerCase()) {
        return NextResponse.json(
          { error: 'Username does not match FID' },
          { status: 400 }
        );
      }

      // Verify wallet address is verified for this FID
      const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
      const custodyAddress = user.custody_address;

      const isVerified = verifiedAddresses.some(
        (addr: string) => addr.toLowerCase() === address.toLowerCase()
      ) || (custodyAddress && custodyAddress.toLowerCase() === address.toLowerCase());

      if (!isVerified) {
        return NextResponse.json(
          { error: 'Wallet address not verified for this FID' },
          { status: 403 }
        );
      }
    } catch (neynarError) {
      console.error('Neynar verification failed:', neynarError);
      return NextResponse.json(
        { error: 'Failed to verify FID ownership' },
        { status: 500 }
      );
    }

    // Create the account from the private key
    let formattedKey = signingPrivateKey.trim();
    if (!formattedKey.startsWith('0x')) {
      formattedKey = '0x' + formattedKey;
    }

    // Validate private key format (should be 0x + 64 hex characters = 32 bytes)
    if (!/^0x[a-fA-F0-9]{64}$/.test(formattedKey)) {
      return NextResponse.json(
        {
          error: `Invalid MINT_SIGNING_KEY format. Expected 0x prefixed 64 character hex string (32 bytes), got length ${formattedKey.length - 2}`
        },
        { status: 500 }
      );
    }

    console.log('Creating account from private key...');
    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    console.log(`Signer address: ${account.address}`);

    // Create the message hash matching the contract's logic:
    // keccak256(abi.encodePacked(fid, username, text, address))
    const packed = encodePacked(
      ['uint256', 'string', 'string', 'address'],
      [BigInt(fid), username, text, address as `0x${string}`]
    );
    console.log(`[Sign] Packed data length: ${packed.length}`);

    const messageHash = keccak256(packed);
    console.log(`[Sign] Message hash: ${messageHash}`);
    console.log(`[Sign] Parameters: fid=${fid}, username="${username}", text="${text.substring(0, 50)}...", address="${address}"`);

    // The contract does:
    // 1. bytes32 messageHash = keccak256(abi.encodePacked(fid, username, text, msg.sender))
    // 2. bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash)
    // 3. address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature)
    //
    // We need to sign in a way that when the contract calls ECDSA.recover with its own prefix,
    // it gets back the correct signer address.

    // Use signMessage which adds the Ethereum prefix
    const signature = await account.signMessage({
      message: { raw: toBytes(messageHash) },
    });

    console.log(`[Sign] Generated signature for fid ${fid}, username ${username}, wallet ${address}`);
    console.log(`[Sign] Signature: ${signature}`);

    // Verify
    const recoveredAddress = await recoverMessageAddress({
      message: { raw: toBytes(messageHash) },
      signature: signature as `0x${string}`,
    });
    console.log(`[Sign] Recovered address: ${recoveredAddress}`);
    console.log(`[Sign] Expected signer: ${account.address}`);

    return NextResponse.json({
      signature,
      messageHash,
      signerAddress: account.address,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error generating mint signature:', errorMessage);
    return NextResponse.json(
      { error: `Failed to generate signature: ${errorMessage}` },
      { status: 500 }
    );
  }
}
