
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import NewGameModal from '../components/NewGameModal';
import StakeConfirmationModal from '../components/StakeConfirmationModal';
import JoinGameModal from '../components/JoinGameModal';
import JoinStakeConfirmationModal from '../components/JoinStakeConfirmationModal';
import TournamentPlaceholder from '../components/TournamentPlaceholder';
import { TimeControl } from '../utils/chessTypes';
import { timeControlOptions } from '../utils/chessUtils';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2 } from 'lucide-react';
import { createGame, getGameById } from '../utils/supabaseClient';

const Index = () => {
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isStakeConfirmationModalOpen, setIsStakeConfirmationModalOpen] = useState(false);
  const [isJoinGameModalOpen, setIsJoinGameModalOpen] = useState(false);
  const [isJoinStakeConfirmationModalOpen, setIsJoinStakeConfirmationModalOpen] = useState(false);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [shareableLink, setShareableLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [animationComplete, setAnimationComplete] = useState(false);
  const { wallet, publicKey } = useWallet();

  const isLoggedIn = wallet?.adapter.connected;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check if user is navigating from a shared link
  useEffect(() => {
    const checkForGameInvite = async () => {
      const params = new URLSearchParams(location.search);
      const gameId = params.get('join');
      
      if (gameId && isLoggedIn) {
        // Fetch game data
        try {
          const gameData = await getGameById(gameId);
          
          if (gameData) {
            const timeControl = timeControlOptions.find(
              option => option.type === gameData.time_control
            ) || timeControlOptions[0];
            
            // Show join confirmation
            setSelectedGameId(gameId);
            setStakeAmount(gameData.stake);
            setSelectedTimeControl(timeControl);
            setIsJoinStakeConfirmationModalOpen(true);
          } else {
            toast({
              title: "Game Not Found",
              description: "The game you were invited to join doesn't exist or has ended.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching game data:", error);
          toast({
            title: "Error",
            description: "Could not load the game invitation.",
            variant: "destructive",
          });
        }
      } else if (gameId && !isLoggedIn) {
        toast({
          title: "Connect Wallet",
          description: "Please connect your wallet to join this game.",
          variant: "default",
        });
      }
    };
    
    checkForGameInvite();
  }, [location, isLoggedIn]);

  const generateShareableLink = (gameId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?join=${gameId}`;
  };

  const handleNewGame = () => {
    if (isLoggedIn) {
      setIsNewGameModalOpen(true);
    } else {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to create a game",
        variant: "destructive",
      });
    }
  };

  const handleJoinGame = () => {
    if (isLoggedIn) {
      setIsJoinGameModalOpen(true);
    } else {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to join a game",
        variant: "destructive",
      });
    }
  };

  const handleCloseStakeConfirmationModal = () => {
    setIsStakeConfirmationModalOpen(false);
  };

  const handleCreateGame = (timeControl: TimeControl, stake: number) => {
    setStakeAmount(stake);
    setSelectedTimeControl(timeControl);
    setIsNewGameModalOpen(false);
    setIsStakeConfirmationModalOpen(true);
  };

  const handleConfirmStake = async () => {
    if (!publicKey || !selectedTimeControl) return;
    
    try {
      // Create the game in the database
      const gameId = await createGame(
        publicKey.toString(),
        selectedTimeControl,
        stakeAmount
      );
      
      if (gameId) {
        // Generate and show shareable link
        const link = generateShareableLink(gameId);
        setShareableLink(link);
        setIsStakeConfirmationModalOpen(false);
        setIsShareLinkModalOpen(true);
        
        // Navigate to the game page
        navigate(`/game/${gameId}`, {
          state: {
            timeControl: selectedTimeControl,
            stake: stakeAmount,
            playerColor: 'white',
            gameId
          }
        });
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Error",
        description: "Failed to create the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinGameSubmit = (gameId: string, stake: number, timeControl: TimeControl) => {
    setSelectedGameId(gameId);
    setStakeAmount(stake);
    setSelectedTimeControl(timeControl);
    setIsJoinGameModalOpen(false);
    setIsJoinStakeConfirmationModalOpen(true);
  };

  const handleConfirmJoinStake = async (gameId: string) => {
    // Navigate directly to the joined game
    navigate(`/game/${gameId}`, {
      state: {
        timeControl: selectedTimeControl,
        stake: stakeAmount,
        playerColor: 'black',
        gameId
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimeControl = (timeControl: TimeControl | null) => {
    if (!timeControl) return '';
    
    const minutes = Math.floor(timeControl.startTime / 60);
    const seconds = timeControl.startTime % 60;
    const secondsStr = seconds > 0 ? `:${seconds}` : '';
    
    return `${minutes}${secondsStr} + ${timeControl.increment}`;
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-solana/20 rounded-full blur-[120px] animate-pulse" />
      <div
        className="absolute top-40 -right-20 w-72 h-72 bg-solana/30 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute -bottom-20 left-1/4 w-80 h-80 bg-solana/25 rounded-full blur-[150px] animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(9,9,11,0.1)_0.1px,transparent_0.1px),linear-gradient(to_right,rgba(9,9,11,0.1)_0.1px,transparent_0.1px)] bg-[size:24px_24px] opacity-20" />

      <Header
      onNewGame={handleNewGame}
      onJoinGame={handleJoinGame}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div
            className={`lg:w-1/2 text-left transition-all duration-1000 ease-out ${
              animationComplete
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-10"
            }`}
          >
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 relative">
              <span className="relative inline-block">
                Play Chess on <span className="text-solana">Solana</span>
                <div className="absolute -bottom-2 left-0 h-1 w-24 bg-solana rounded-full"></div>
              </span>
            </h1>
            <p className="text-lg mb-8 text-gray-300 leading-relaxed max-w-xl">
              CompChess is a chess platform where you can challenge opponents
              and compete for SOL stakes in secure, transparent matches powered
              by blockchain technology.
            </p>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleNewGame}
                  className="bg-solana hover:bg-solana-dark text-white px-6 py-6 sm:px-8 text-base sm:text-lg relative group overflow-hidden"
                  size="lg"
                >
                  <span className="relative z-10">Create Game</span>
                  <span className="absolute inset-0 h-full w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
                </Button>
                <Button
                  onClick={handleJoinGame}
                  variant="outline"
                  className="px-6 py-6 sm:px-8 text-base sm:text-lg border-2 hover:bg-card/80 transition-all duration-300"
                  size="lg"
                >
                  Join Game
                </Button>
              </div>
            </div>
          </div>

          <div
            className={`lg:w-1/2 w-full transition-all duration-1000 ease-out delay-300 ${
              animationComplete
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-solana/50 to-solana-light/30 rounded-lg blur-md"></div>
              <div className="relative bg-card/90 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="bg-solana h-5 w-1 mr-3 rounded-full"></span>
                  Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light/80 mt-1 mr-3 flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                      <p className="text-sm sm:text-base">
                        Challenge others to 1v1 matches with customizable time
                        controls
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light/80 mt-1 mr-3 flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                      <p className="text-sm sm:text-base">
                        Stake SOL on games and compete for winnings
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light/80 mt-1 mr-3 flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                      <p className="text-sm sm:text-base">
                        Secure and transparent gameplay with Solana blockchain
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-solana-light/80 mt-1 mr-3 flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                      <p className="text-sm sm:text-base">
                        Choose from Blitz, Rapid, or Classical time controls
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      navigate("/game/new", {
                        state: {
                          timeControl: timeControlOptions[0],
                          stake: 0,
                          gameId: "practice",
                        },
                      })
                    }
                    variant="secondary"
                    className="w-full py-5 relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      Play Practice Game (No Stakes)
                    </span>
                    <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 -translate-x-full group-hover:translate-x-full"></span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <TournamentPlaceholder />
        </div>
      </main>

      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onCreateGame={handleCreateGame}
      />

      <StakeConfirmationModal
        isOpen={isStakeConfirmationModalOpen}
        onClose={handleCloseStakeConfirmationModal}
        onConfirm={handleConfirmStake}
        stake={stakeAmount}
        timeControl={formatTimeControl(selectedTimeControl)}
        timeControlObject={selectedTimeControl}
      />

      <JoinGameModal
        isOpen={isJoinGameModalOpen}
        onClose={()=> setIsJoinGameModalOpen(false)}
        onJoinGame={handleJoinGameSubmit}
      />

      <JoinStakeConfirmationModal
        isOpen={isJoinStakeConfirmationModalOpen}
        onClose={() => setIsJoinStakeConfirmationModalOpen(false)}
        onConfirm={handleConfirmJoinStake}
        gameId={selectedGameId}
        stake={stakeAmount}
        timeControl={formatTimeControl(selectedTimeControl)}
        timeControlObject={selectedTimeControl}
      />

      {/* Share Link Modal */}
      <Dialog open={isShareLinkModalOpen} onOpenChange={setIsShareLinkModalOpen}>
        <DialogContent className="bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Share Game Invitation</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-300">
              Share this link with your friend to invite them to join your game:
            </p>
            
            <div className="flex items-center space-x-2">
              <Input 
                value={shareableLink} 
                readOnly 
                className="flex-1 bg-secondary/30"
              />
              <Button
                variant="outline" 
                size="icon" 
                onClick={handleCopyLink} 
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="bg-secondary/40 p-4 rounded-md text-sm space-y-2">
              <p className="font-medium flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                Game ready to play!
              </p>
              <p className="text-gray-300">
                You've been redirected to the game page. Once your friend joins with the link, the game will start automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setIsShareLinkModalOpen(false)}
              className="bg-solana hover:bg-solana-dark text-white"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
