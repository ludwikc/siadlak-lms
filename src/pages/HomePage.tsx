import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ShieldCheck, GraduationCap, Code, Users } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-discord-bg">
      <header className="bg-discord-sidebar-bg py-20 text-center">
        <h1 className="text-5xl font-bold text-discord-header-text">
          Welcome to SIADLAK.COURSES
        </h1>
        <p className="mt-4 text-lg text-discord-secondary-text">
          Your gateway to mastering Web3 development
        </p>
        <Link
          to="/courses"
          className="mt-8 inline-block rounded-md bg-discord-brand px-8 py-3 font-medium text-white transition-colors hover:bg-discord-text"
        >
          Explore Courses
        </Link>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-discord-header-text">
              Why Choose SIADLAK.COURSES?
            </h2>
            <p className="text-discord-text">
              We offer a comprehensive and engaging learning experience tailored for
              aspiring Web3 developers. Our courses are designed to provide you with
              the knowledge and skills you need to succeed in this rapidly evolving
              field.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <Rocket className="mt-1 h-6 w-6 text-discord-brand" />
                <div>
                  <h3 className="font-medium text-discord-header-text">
                    Cutting-Edge Content
                  </h3>
                  <p className="text-discord-text">
                    Stay ahead with the latest trends and technologies in Web3
                    development.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-6 w-6 text-discord-brand" />
                <div>
                  <h3 className="font-medium text-discord-header-text">
                    Expert Instruction
                  </h3>
                  <p className="text-discord-text">
                    Learn from industry professionals with years of experience in Web3
                    development.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <GraduationCap className="mt-1 h-6 w-6 text-discord-brand" />
                <div>
                  <h3 className="font-medium text-discord-header-text">
                    Hands-On Projects
                  </h3>
                  <p className="text-discord-text">
                    Apply your knowledge through real-world projects and build a
                    portfolio to showcase your skills.
                  </p>
                </div>
              </li>
            </ul>
            
            {/* Development Links - TO BE REMOVED AFTER DISCORD SSO FIX */}
            <div className="mt-8 space-y-4 border-t border-discord-deep-bg pt-4">
              <h3 className="text-sm font-medium text-discord-secondary-text">Development Access:</h3>
              <div className="space-x-4">
                <a 
                  href="/dev/courses"
                  className="text-sm text-discord-brand hover:underline"
                >
                  Dev Client Dashboard
                </a>
                <a 
                  href="/dev/admin"
                  className="text-sm text-discord-brand hover:underline"
                >
                  Dev Admin Dashboard
                </a>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-discord-header-text">
              Featured Courses
            </h2>
            <div className="rounded-md border border-discord-sidebar-bg bg-discord-deep-bg p-6">
              <div className="flex items-center gap-4">
                <Code className="h-8 w-8 text-discord-brand" />
                <h3 className="text-xl font-medium text-discord-header-text">
                  Web3 Fundamentals
                </h3>
              </div>
              <p className="mt-2 text-discord-text">
                Get started with the basics of Web3 development, including
                blockchain technology, smart contracts, and decentralized
                applications.
              </p>
              <Link
                to="/courses/web3-fundamentals"
                className="mt-4 inline-block rounded-md bg-discord-brand px-6 py-2 font-medium text-white transition-colors hover:bg-discord-text"
              >
                Learn More
              </Link>
            </div>
            <div className="rounded-md border border-discord-sidebar-bg bg-discord-deep-bg p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-discord-brand" />
                <h3 className="text-xl font-medium text-discord-header-text">
                  Decentralized Governance
                </h3>
              </div>
              <p className="mt-2 text-discord-text">
                Explore the principles and practices of decentralized governance and
                learn how to build and participate in decentralized organizations.
              </p>
              <Link
                to="/courses/decentralized-governance"
                className="mt-4 inline-block rounded-md bg-discord-brand px-6 py-2 font-medium text-white transition-colors hover:bg-discord-text"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
