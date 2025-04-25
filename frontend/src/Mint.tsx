import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConnectButton from "./components/ConnectButton";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { aetheriaAvatarAbi, aetheriaAvatarAddress } from "./generated";
import "./styles/pixel.css";

const MintPage: React.FC = () => {
    const [selectedGender, setSelectedGender] = useState<"male" | "female">(
        "male"
    );
    const [mintInitiated, setMintInitiated] = useState(false); // Track if minting started
    const chainId = useChainId();
    const { writeContract, isPending, isSuccess, isError } = useWriteContract();
    const { address } = useAccount();

    useEffect(() => {
        fetch("https://aetheria.onrender.com/ping", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
    }, []);

    const handleMint = async () => {
        if (!selectedGender) return;
        if (!address) {
            alert("Please connect your wallet first.");
            return;
        }
        localStorage.setItem("walletAddress", address);
        setMintInitiated(true); // Indicate minting process has started
        // Call backend API to generate the avatar
        // const resp = await fetch("http://localhost:8080/generate_avatar", {
        const resp = await fetch(
            "https://aetheria.onrender.com/generate_avatar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    address: address,
                    sex: selectedGender,
                }),
            }
        );
        const data = await resp.json();
        const imageUrl = data.image_url;
        if (!imageUrl) {
            alert("Failed to generate avatar. Please try again.");
            setMintInitiated(false);
            return;
        }
        localStorage.setItem("avatarImageUrl", imageUrl);
        writeContract({
            address:
                aetheriaAvatarAddress[
                    chainId as keyof typeof aetheriaAvatarAddress
                ],
            abi: aetheriaAvatarAbi,
            functionName: "mintAvatar",
            args: [imageUrl],
        });
    };

    // Effect to reset mintInitiated state once transaction settles
    useEffect(() => {
        if (isSuccess || isError) {
            setMintInitiated(false);
        }
    }, [isSuccess, isError]);

    // Condition to show the animation based on user request
    // Show if initiated AND the specific end condition (isSuccess && isPending) is NOT met
    const showAnimation = mintInitiated && !(isSuccess && isPending);

    // Disable button only when transaction is pending
    const disableButton = isPending;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Image - Fixed to cover entire viewport */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/images/summoning-bg.png"
                    alt="Summoning Background"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
                <div className="w-full flex justify-center pb-4">
                    <ConnectButton />
                </div>
                <div className="rpg-card flex flex-col items-center justify-center max-w-md w-full bg-opacity-90 mx-auto">
                    <div className="grid grid-cols-2 gap-4 mb-8 w-full">
                        <motion.button
                            className={`pixel-button ${selectedGender === "male" ? "selected" : ""}`}
                            onClick={() => setSelectedGender("male")}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>MALE</span>
                        </motion.button>

                        <motion.button
                            className={`pixel-button ${selectedGender === "female" ? "selected" : ""}`}
                            onClick={() => setSelectedGender("female")}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>FEMALE</span>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {showAnimation && ( // Use the specific animation condition
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                            >
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src="/assets/images/summoning-animation.gif"
                                        alt="Summoning Animation"
                                        className="w-full h-full object-cover"
                                    />
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center text-rpg-accent text-4xl"
                                        animate={{
                                            x: [0, 800, -800, 0, 800, -800, 0],
                                            y: [0, -250, 250, 0, -250, 250, 0],
                                            rotate: [0, 360],
                                        }}
                                        transition={{
                                            x: {
                                                duration: 32,
                                                repeat: Infinity,
                                                ease: "linear",
                                            },
                                            y: {
                                                duration: 12,
                                                repeat: Infinity,
                                                ease: "linear",
                                            },
                                            rotate: {
                                                duration: 8,
                                                repeat: Infinity,
                                                ease: "linear",
                                            },
                                        }}
                                        style={{
                                            textShadow: "2px 2px 0px #2a2a2a",
                                            letterSpacing: "2px",
                                            color: "#7562cc",
                                            fontFamily: "'Freddy', monospace",
                                        }}
                                    >
                                        SUMMONING AVATAR ...
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        className="relative w-64"
                        onClick={handleMint}
                        disabled={disableButton || !selectedGender} // Disable if pending or no gender selected
                    >
                        <motion.div
                            className="relative w-full h-full"
                            animate={{
                                rotate: [0, -0.5, 0.5, -0.5, 0.5, 3, -3, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            whileHover={{
                                rotate: [3, -3, 3, -3, 3, -3],
                                transition: {
                                    duration: 0.5,
                                    repeat: Infinity,
                                },
                            }}
                        >
                            <img
                                src="/assets/images/summon-button.png"
                                alt="Summon Character"
                                className="w-64 object-contain"
                            />
                        </motion.div>
                    </button>
                </div>
                <a
                    href="/app/"
                    className={`pixel-button p-2 ${isSuccess ? "selected" : ""}`}
                >
                    {isSuccess
                        ? "Enter Aetheria"
                        : "Skip Mint and Try Aetheria"}
                </a>
            </div>
        </div>
    );
};

export default MintPage;
