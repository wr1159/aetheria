// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AetheriaAvatar is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Struct to hold NFT attributes
    struct AvatarAttributes {
        uint256 xp;
        uint256 level;
        uint256 questionsAnswered;
    }

    // Mapping from tokenId to attributes
    mapping(uint256 => AvatarAttributes) public avatarAttributes;

    // Events
    event AttributesIncremented(
        uint256 indexed tokenId,
        uint256 xp,
        uint256 level,
        uint256 questionsAnswered
    );

    constructor() ERC721("Aetheria", "ATH") Ownable(msg.sender) {}

    function mintAvatar(
        address player,
        string memory tokenURI
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(player, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Initialize attributes
        avatarAttributes[tokenId] = AvatarAttributes({
            xp: 0,
            level: 1,
            questionsAnswered: 0
        });

        return tokenId;
    }

    function incrementAttributes(
        uint256 tokenId,
        uint256 xpIncrement,
        uint256 questionsIncrement
    ) public onlyOwner {
        require(tokenId < _nextTokenId, "Token does not exist");

        AvatarAttributes storage attributes = avatarAttributes[tokenId];

        // Increment XP and questions answered
        attributes.xp += xpIncrement;
        attributes.questionsAnswered += questionsIncrement;

        // Calculate level based on XP (every 1000 XP = 1 level)
        attributes.level = (attributes.xp / 1000) + 1;

        emit AttributesIncremented(
            tokenId,
            attributes.xp,
            attributes.level,
            attributes.questionsAnswered
        );
    }

    function getAvatarAttributes(
        uint256 tokenId
    )
        public
        view
        returns (uint256 xp, uint256 level, uint256 questionsAnswered)
    {
        require(tokenId < _nextTokenId, "Token does not exist");
        AvatarAttributes memory attributes = avatarAttributes[tokenId];
        return (attributes.xp, attributes.level, attributes.questionsAnswered);
    }
}
