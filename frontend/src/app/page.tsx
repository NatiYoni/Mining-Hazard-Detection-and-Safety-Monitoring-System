import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Activity, Video, Radio } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-yellow-500 selection:text-slate-950 flex flex-col">
        {/* Navigation */}
        <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                    <ShieldCheck className="h-6 w-6 text-yellow-500" />
                    <span>MineGuard<span className="text-yellow-500">.</span></span>
                </div>
                <div className="flex gap-4">
                    <Link href="/login" className="text-sm font-medium hover:text-white text-slate-300 transition-colors flex items-center">
                        Sign In
                    </Link>
                    <Link href="/register" className="text-sm font-medium bg-yellow-500 text-slate-950 px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors">
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Layers */}
            <div className="absolute inset-0 z-0">
                {/* Layer 1: Base Image (Subtle Texture) */}
                <Image
                    src="/hero-bg.png"
                    alt="Underground mining operation"
                    fill
                    className="object-cover opacity-20"
                    priority
                />
                
                {/* Layer 2: Colorful Animated Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                     <div className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
                     <div className="absolute top-[20%] -right-[10%] w-[35rem] h-[35rem] bg-yellow-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
                     <div className="absolute -bottom-[10%] left-[20%] w-[45rem] h-[45rem] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-2000"></div>
                </div>

                {/* Layer 3: Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950" />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 text-white drop-shadow-2xl">
                    Standardizing Safety <br className="hidden lg:block" /> Below the Surface.
                </h1>
                
                <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
                    Advanced real-time monitoring for mining operations. Detect hazards, track personnel, and analyze environmental data to ensure zero-harm workplaces.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/register" className="group flex items-center justify-center gap-2 bg-yellow-500 text-slate-950 px-8 py-4 rounded-full font-bold hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
                        Get Started
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link href="/login" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all w-full sm:w-auto">
                        Live Demo
                    </Link>
                </div>
            </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-slate-900 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold mb-4">Comprehensive Hazard Detection</h2>
                    <p className="text-slate-400">Integrated sensors and AI-driven analytics provide complete situational awareness for mine safety officers.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                     <FeatureCard 
                        icon={<Activity className="h-8 w-8 text-blue-500" />}
                        title="Environmental Monitoring"
                        description="Real-time tracking of toxic gases (CO, CH4), temperature, and humidity levels to prevent exposure incidents."
                     />
                     <FeatureCard 
                        icon={<Video className="h-8 w-8 text-yellow-500" />}
                        title="Video Surveillance"
                        description="Real-time camera feeds to monitor unauthorized access and PPE compliance, and allow supervisors to visually assess risks like flooding, fire, or falls."
                     />
                     <FeatureCard 
                        icon={<Radio className="h-8 w-8 text-rose-500" />}
                        title="IoT Connectivity"
                        description="Robust ESP32-based sensor network ensuring reliable data transmission even in deep underground environments."
                     />
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-slate-950 border-t border-white/10 mt-auto">
             <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                <p>&copy; 2026 Mining Safety Systems. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
             </div>
        </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-colors">
            <div className="mb-4 p-3 bg-white/5 rounded-xl inline-block">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100">{title}</h3>
            <p className="text-slate-400 leading-relaxed">
                {description}
            </p>
        </div>
    )
}

