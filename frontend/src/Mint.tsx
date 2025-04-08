import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConnectButton from "./components/ConnectButton";
import { useChainId, useWriteContract } from "wagmi";
import { aetheriaAvatarAbi, aetheriaAvatarAddress } from "./generated";
import "./styles/pixel.css";

const MintPage: React.FC = () => {
    const [selectedGender, setSelectedGender] = useState<"male" | "female">(
        "male"
    );
    const [isSummoning, setIsSummoning] = useState(false);
    const chainId = useChainId();
    const { writeContract } = useWriteContract();

    const handleMint = async () => {
        if (!selectedGender) return;

        setIsSummoning(true);
        writeContract({
            address:
                aetheriaAvatarAddress[
                    chainId as keyof typeof aetheriaAvatarAddress
                ],
            abi: aetheriaAvatarAbi,
            functionName: "mintAvatar",
            args: [selectedGender], // TODO: Make link from API
        });
        setTimeout(() => {
            setIsSummoning(false);
        }, 3000);
    };

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
                            className={`pixel-button ${
                                selectedGender === "male" ? "selected" : ""
                            }`}
                            onClick={() => setSelectedGender("male")}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>MALE</span>
                        </motion.button>

                        <motion.button
                            className={`pixel-button ${
                                selectedGender === "female" ? "selected" : ""
                            }`}
                            onClick={() => setSelectedGender("female")}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>FEMALE</span>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {isSummoning && (
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
                                            x: [0, 200, -200, 0],
                                            y: [0, -100, 100, 0],
                                            rotate: [0, 360],
                                        }}
                                        transition={{
                                            x: {
                                                duration: 8,
                                                repeat: Infinity,
                                                ease: "linear",
                                            },
                                            y: {
                                                duration: 6,
                                                repeat: Infinity,
                                                ease: "linear",
                                            },
                                            rotate: {
                                                duration: 4,
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
                        onClick={() => {
                            handleMint();
                        }}
                        disabled={!selectedGender || isSummoning}
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
            </div>
        </div>
    );
};

export default MintPage;
