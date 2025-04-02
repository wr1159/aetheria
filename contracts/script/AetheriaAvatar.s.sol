// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {AetheriaAvatar} from "../src/AetheriaAvatar.sol";

contract AetheriaAvatarScript is Script {
    AetheriaAvatar public aetheriaAvatar;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        aetheriaAvatar = new AetheriaAvatar();

        vm.stopBroadcast();
    }
}
