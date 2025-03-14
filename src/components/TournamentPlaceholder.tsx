
import React from 'react';
import { Trophy, Calendar, Users, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TournamentPlaceholder: React.FC = () => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy size={20} className="text-solana" />
          Tournaments
          <Badge variant="outline" className="ml-2 bg-secondary text-xs">Coming Soon</Badge>
        </h2>
        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
          View All <ChevronRight size={14} />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/60 border border-white/5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-solana/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Blitz Tournament</CardTitle>
            <CardDescription className="text-xs flex items-center gap-2">
              <Calendar size={12} /> Coming Soon
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users size={12} />
              <span>32 players max</span>
            </div>
            <div className="text-sm mt-2">
              <span className="text-solana font-semibold">2.5 SOL</span> prize pool
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full text-xs py-1 h-8 opacity-50 cursor-not-allowed" disabled>
              Join Tournament
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-card/60 border border-white/5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-solana/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Championship</CardTitle>
            <CardDescription className="text-xs flex items-center gap-2">
              <Calendar size={12} /> Coming Soon
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users size={12} />
              <span>64 players max</span>
            </div>
            <div className="text-sm mt-2">
              <span className="text-solana font-semibold">10 SOL</span> prize pool
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full text-xs py-1 h-8 opacity-50 cursor-not-allowed" disabled>
              Join Tournament
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TournamentPlaceholder;
