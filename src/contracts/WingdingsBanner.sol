// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Strings.sol";
import "lib/openzeppelin-contracts/contracts/utils/Base64.sol";
import "lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

contract X4E is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, Pausable {
    using Strings for uint256;

    struct TokenData {
        string handle;
        string imageURI;
    }

    mapping(uint256 => TokenData) public tokenData;
    mapping(string => bool) public usedHandles;

    uint256 public constant PRICE_WEI = 1_000_000_000_000; // 0.000001 ETH
    address payable public ownerRecipient;
    address payable public constant SPLIT_RECIPIENT = payable(0x56f1f5C3dC7dcB9389759007B6Ef9512144C461f);

    address public trustedSigner;

    error HandleAlreadyMinted(string handle);
    error InvalidSignature();

    event Minted(address indexed minter, uint256 indexed tokenId, string handle, string imageURI, uint256 paidWei);
    event TokenURIUpdated(uint256 indexed tokenId, string newURI);

    constructor(address payable _ownerRecipient)
        ERC721("XFC4FOH", "Y5F")
        Ownable(msg.sender)
    {
        require(_ownerRecipient != address(0), "INVALID_RECIPIENT");
        ownerRecipient = _ownerRecipient;
    }

    function setOwnerRecipient(address payable _ownerRecipient) external onlyOwner {
        require(_ownerRecipient != address(0), "INVALID_RECIPIENT");
        ownerRecipient = _ownerRecipient;
    }

    function setTrustedSigner(address _signer) external onlyOwner {
        trustedSigner = _signer;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateTokenURI(uint256 tokenId, string memory newURI) external onlyOwner {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, newURI);
        emit TokenURIUpdated(tokenId, newURI);
    }

    function mint(
        string calldata handle,
        string calldata imageURI,
        bytes calldata signature
    ) external payable whenNotPaused {
        // Check if handle already minted
        if (usedHandles[handle]) revert HandleAlreadyMinted(handle);

        // Validate handle length
        require(bytes(handle).length > 0 && bytes(handle).length <= 64, "HANDLE");

        // Validate imageURI is not empty
        require(bytes(imageURI).length > 0, "IMAGE_URI");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(handle, imageURI, msg.sender));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);

        if (recoveredSigner == address(0) || recoveredSigner != trustedSigner) {
            revert InvalidSignature();
        }

        // Mark handle as used BEFORE external calls (reentrancy protection)
        usedHandles[handle] = true;

        // Validate payment
        require(msg.value >= PRICE_WEI, "PRICE");

        // Generate token ID based on current supply
        uint256 tokenId = totalSupply() + 1;

        // Store token data
        tokenData[tokenId] = TokenData({handle: handle, imageURI: imageURI});

        // Mint the NFT
        _safeMint(msg.sender, tokenId);

        // Generate and set token URI
        string memory uri = generateTokenURI(tokenId);
        _setTokenURI(tokenId, uri);

        // Emit event
        emit Minted(msg.sender, tokenId, handle, imageURI, msg.value);

        // Split fee 50/50, with dust going to ownerRecipient
        uint256 half = msg.value / 2;
        uint256 dust = msg.value % 2;

        (bool ok1, ) = ownerRecipient.call{value: half + dust}("");
        require(ok1, "OWNER_SEND");

        (bool ok2, ) = SPLIT_RECIPIENT.call{value: half}("");
        require(ok2, "SPLIT_SEND");
    }

    function updateImageURI(uint256 tokenId, string calldata newImageURI) external onlyOwner {
        _requireOwned(tokenId);

        // Validate new image URI is not empty
        require(bytes(newImageURI).length > 0, "IMAGE_URI");

        tokenData[tokenId].imageURI = newImageURI;
        string memory newURI = generateTokenURI(tokenId);
        _setTokenURI(tokenId, newURI);

        emit TokenURIUpdated(tokenId, newURI);
    }

    function generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        _requireOwned(tokenId);
        TokenData memory data = tokenData[tokenId];

        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name": "XFC4FOH #',
                    tokenId.toString(),
                    '", "description": "Pixel-vector banner for @',
                    data.handle,
                    '", "image": "',
                    data.imageURI,
                    '"}'
                )
            ))
        );

        return string(abi.encodePacked('data:application/json;base64,', json));
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) return;

        // Split any remaining balance 50/50, with dust to ownerRecipient
        uint256 half = balance / 2;
        uint256 dust = balance % 2;

        (bool ok1, ) = ownerRecipient.call{value: half + dust}("");
        require(ok1, "OWNER_WITHDRAW");

        (bool ok2, ) = SPLIT_RECIPIENT.call{value: half}("");
        require(ok2, "SPLIT_WITHDRAW");
    }

    // ============ ERC721 Overrides ============

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }
}
