'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Code2, LayoutDashboard, MonitorCog, Rocket, Smartphone, Sparkles } from 'lucide-react';

export const ServicesSection = () => {
  const services = [
    { 
      icon: <Smartphone size={20} />, 
      title: 'Mobile Applications', 
      text: 'Clean, user-centric mobile designs, production prototypes, and native integrations.',
      color: 'text-brand-orange bg-orange-50 border-orange-100'
    },
    { 
      icon: <LayoutDashboard size={20} />, 
      title: 'Web Systems & Portals', 
      text: 'Secure administrative consoles, analytics dashboards, and custom backend tools.',
      color: 'text-brand-teal bg-teal-50 border-teal-100'
    },
    { 
      icon: <Code2 size={20} />, 
      title: 'High-Performance Websites', 
      text: 'Lightning-fast landing pages and content platforms optimized for scale and conversion.',
      color: 'text-brand-blue bg-blue-50 border-blue-100'
    },
    { 
      icon: <MonitorCog size={20} />, 
      title: 'Internal Operations Tools', 
      text: 'Desktop workflow utilities, custom automations, and tools that help teams execute faster.',
      color: 'text-brand-amber bg-amber-50 border-amber-100'
    },
    { 
      icon: <Bot size={20} />, 
      title: 'AI & Automation Pipelines', 
      text: 'Intelligent process automation, language model fine-tuning, and document processing systems.',
      color: 'text-purple-600 bg-purple-50 border-purple-100'
    },
    { 
      icon: <Rocket size={20} />, 
      title: 'Experimental Launches', 
      text: 'Rapid prototypes, developer showcases, and experimental software validation.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
  ];

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section id="services" className="w-full py-20 md:py-24 bg-slate-50 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-start">
          
          {/* Sticky left introduction */}
          <div className="lg:sticky lg:top-24 space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-full border border-slate-200 mb-4">
              Our Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950 tracking-tight leading-tight">
              What Ujjwalit engineers outside the classroom.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              We are first and foremost a software engineering consultancy. We design, deploy, and scale enterprise applications, automated backend scripts, and custom AI tooling for businesses worldwide.
            </p>
            <div className="pt-2">
              <a
                href="https://ujjwalit.co.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-extrabold text-white hover:bg-brand-orange hover:shadow-lg transition-all active:scale-95"
              >
                Explore Consulting Services
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          {/* Staggered grid right */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 gap-5"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5"
              >
                {/* Radial Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top_right,rgba(232,130,42,0.03),transparent_50%)] pointer-events-none" />

                <div className={`relative h-10 w-10 rounded-xl border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 ${service.color}`}>
                  {service.icon}
                </div>
                <h3 className="relative mt-5 font-extrabold text-slate-950 text-base sm:text-lg group-hover:text-brand-orange transition-colors">
                  {service.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                  {service.text}
                </p>
                <span className="absolute bottom-6 right-6 text-sm font-extrabold text-slate-200 select-none group-hover:text-slate-350 transition-colors font-mono">
                  0{index + 1}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
