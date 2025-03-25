import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MintPage: React.FC = () => {
    const [selectedGender, setSelectedGender] = useState<
        "male" | "female" | null
    >(null);
    const [isSummoning, setIsSummoning] = useState(false);

    const handleMint = async () => {
        if (!selectedGender) return;

        setIsSummoning(true);
        // TODO: Implement actual minting logic here
        setTimeout(() => {
            setIsSummoning(false);
        }, 3000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="rpg-card max-w-md w-full">
                <h1 className="text-2xl text-center mb-8 text-rpg-accent">
                    Summon Your Character
                </h1>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        className={`rpg-button ${
                            selectedGender === "male" ? "bg-rpg-secondary" : ""
                        }`}
                        onClick={() => setSelectedGender("male")}
                    >
                        <span className="text-xl">♂️</span>
                        <span className="block text-sm">Male</span>
                    </button>

                    <button
                        className={`rpg-button ${
                            selectedGender === "female"
                                ? "bg-rpg-secondary"
                                : ""
                        }`}
                        onClick={() => setSelectedGender("female")}
                    >
                        <span className="text-xl">♀️</span>
                        <span className="block text-sm">Female</span>
                    </button>
                </div>

                <AnimatePresence>
                    {isSummoning && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                        >
                            <motion.div
                                className="text-rpg-accent text-4xl"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 360],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                ✨ Summoning... ✨
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    className="rpg-button w-full"
                    onClick={handleMint}
                    disabled={!selectedGender || isSummoning}
                >
                    {isSummoning ? "Summoning..." : "Summon Character"}
                </button>
            </div>
        </div>
    );
};

export default MintPage;
