// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/AetheriaAvatar.sol";

contract AetheriaAvatarTest is Test {
    AetheriaAvatar public aetheriaAvatar;
    address public owner;
    address public player;

    function setUp() public {
        owner = address(this);
        player = address(0x123);
        aetheriaAvatar = new AetheriaAvatar();
    }

    function testMintAvatar() public {
        uint256 tokenId = aetheriaAvatar.mintAvatar(player, "tokenURI");
        (uint256 xp, uint256 level, uint256 questionsAnswered) = aetheriaAvatar
            .getAvatarAttributes(tokenId);

        assertEq(xp, 0, "XP should be initialized to 0");
        assertEq(level, 1, "Level should be initialized to 1");
        assertEq(
            questionsAnswered,
            0,
            "Questions answered should be initialized to 0"
        );
    }

    function testIncrementAttributes() public {
        uint256 tokenId = aetheriaAvatar.mintAvatar(player, "tokenURI");

        // Increment attributes
        aetheriaAvatar.incrementAttributes(tokenId, 1500, 5);
        (uint256 xp, uint256 level, uint256 questionsAnswered) = aetheriaAvatar
            .getAvatarAttributes(tokenId);

        assertEq(xp, 1500, "XP should be incremented to 1500");
        assertEq(level, 2, "Level should be incremented to 2");
        assertEq(
            questionsAnswered,
            5,
            "Questions answered should be incremented to 5"
        );
    }

    function testIncrementAttributesOnlyOwner() public {
        uint256 tokenId = aetheriaAvatar.mintAvatar(player, "tokenURI");

        // Attempt to increment attributes from a non-owner address
        vm.expectRevert();
        vm.prank(player);
        aetheriaAvatar.incrementAttributes(tokenId, 1000, 1);
    }

    function testGetAvatarAttributes() public {
        uint256 tokenId = aetheriaAvatar.mintAvatar(player, "tokenURI");
        aetheriaAvatar.incrementAttributes(tokenId, 2000, 3);

        (uint256 xp, uint256 level, uint256 questionsAnswered) = aetheriaAvatar
            .getAvatarAttributes(tokenId);

        assertEq(xp, 2000, "XP should be 2000");
        assertEq(level, 3, "Level should be 3");
        assertEq(questionsAnswered, 3, "Questions answered should be 3");
    }
}
