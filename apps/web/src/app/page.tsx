"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Droplet, Zap, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 relative overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left - Purple Circle */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Top Right - Orange Circle */}
        <div className="absolute top-20 right-10 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        {/* Bottom Left - Green Circle */}
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-green/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        
        {/* Bottom Right - Green Circle */}
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-green/20 rounded-full blur-2xl animate-pulse delay-700"></div>
      </div>

      {/* Hero Section - Centered Layout */}
      <section className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] py-20">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Main Headline with Drip Icon */}
              <div className="space-y-4">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                    <span className="text-green">Drip Payments</span>
                    <br />
                    Like Water
                  </h1>
                </div>
                
                {/* Tagline/Description */}
                <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed">
                  Continuous, automatic payments that{" "}
                  <span className="text-green font-semibold">flow steadily</span> over time.
                </p>
              </div>

              {/* Key Benefits */}
              {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
                <div className="flex flex-col items-center lg:items-start gap-2">
                  <Clock className="h-6 w-6 text-green" />
                  <span className="text-sm text-foreground/80">24/7 Automated</span>
                </div>
                <div className="flex flex-col items-center lg:items-start gap-2">
                  <Shield className="h-6 w-6 text-green" />
                  <span className="text-sm text-foreground/80">Smart Contract</span>
                </div>
                <div className="flex flex-col items-center lg:items-start gap-2">
                  <Zap className="h-6 w-6 text-green" />
                  <span className="text-sm text-foreground/80">Instant & Secure</span>
                </div>
              </div> */}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="px-8 py-6 text-base font-semibold bg-green text-white rounded-lg hover:bg-green-dark transition-all duration-300 shadow-lg shadow-green/20"
                  asChild
                >
                  <Link href="/streams/create" className="flex items-center gap-2">
                    Start Dripping
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-base font-semibold rounded-lg border-2 border-green text-foreground bg-background hover:bg-green/10 hover:border-green transition-all duration-300"
                  asChild
                >
                  <Link href="/streams" className="flex items-center gap-2">
                    View Streams
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Dripping Animation Visualization */}
            <div className="relative h-[520px] flex items-center justify-center">
              {/* Soft focus area to subtly highlight animation */}
              <div className="absolute inset-6 rounded-[36px] bg-gradient-to-b from-black/45 via-black/25 to-transparent blur-3xl pointer-events-none"></div>
              
              <div className="relative w-full max-w-md h-full">
                {/* Source Container (Top) */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-16 bg-white/5 rounded-xl border border-white/20 flex items-center justify-center">
                  <div className="text-center space-y-1">
                    <Droplet className="h-6 w-6 text-white mx-auto opacity-90" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/80">
                      Funds Pool
                    </span>
                  </div>
                </div>

                {/* Dripping Drops Animation */}
                {/** Define drop paths that align with each flow line */}
                {(() => {
                  const dropTargets = [20, 35, 50, 65, 80]; // percent positions for each line
                  return (
                    <div className="absolute top-16 left-0 w-full h-[360px] overflow-visible">
                      {dropTargets.map((target, idx) => (
                        <div
                          key={`drop-${idx}`}
                          className="diagonal-drop"
                          style={
                            {
                              "--target-x": `${target}%`,
                              "--start-top": "110px",
                              "--dy": "230px",
                              "--duration": `${2.5 + idx * 0.2}s`,
                              animationDelay: `${idx * 0.25}s`,
                            } as CSSProperties
                          }
                        >
                          <div className="w-2.5 h-11 bg-gradient-to-b from-white via-white/70 to-transparent rounded-full opacity-90"></div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                

                {/* Recipient Containers (Bottom) */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full flex justify-around">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-20 h-18 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center relative overflow-hidden animate-fill"
                      style={{
                        animationDuration: `${3.5 + i * 0.4}s`,
                        animationDelay: `${0.8 + i * 0.4}s`,
                      }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/50 to-transparent"
                        style={{ height: `${25 + i * 18}%` }}
                      ></div>
                      <Droplet className="h-5 w-5 text-white opacity-80" />
                    </div>
                  ))}
                </div>

                {/* Flow Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  {[20, 35, 50, 65, 80].map((target, idx) => (
                    <line
                      key={`line-${idx}`}
                      x1="50%"
                      y1="110"
                      x2={`${target}%`}
                      y2="330"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1.5"
                      strokeDasharray="3 6"
                      className="animate-pulse"
                      style={{
                        animationDelay: `${idx * 0.15}s`,
                      }}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Explanation Text Below */}
          {/* <div className="mt-16 text-center max-w-3xl mx-auto">
            <p className="text-lg text-foreground/70 leading-relaxed">
              Instead of sending large lump sums, <span className="text-green font-semibold">drip your payments</span> steadily over time.
              <br />
              Perfect for salaries, subscriptions, recurring expenses, and more. Every second, every hour, every day—automatic.
            </p>
          </div> */}
        </div>
      </section>
    </main>
  );
}
