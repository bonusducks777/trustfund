"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertCircle, ChevronDown, DollarSign, Users, Clock, Target, ThumbsUp, AlertTriangle, Moon, Sun, ExternalLink, CheckCircle2, Clock3, ChevronRight, Share2, Wallet } from "lucide-react"
import Link from 'next/link'
import * as StellarSdk from 'stellar-sdk'
import { isConnected } from '@stellar/freighter-api'
import freighter from '@stellar/freighter-api'
import Image from 'next/image'



interface Project {
  id: number;
  name: string;
  amountHeld: number;
  amountTarget: number;
  summary: string;
  description: string;
  claimant: string;
  claimantWebsite: string;
  authenticatorsPending: number;
  totalAuthenticators: number;
  authenticators: Array<{
    name: string;
    website: string;
    status: string;
  }>;
  deadline: Date;
  approvalRating: number;
  donorsCount: number;
  objectiveGoals: Array<{
    goal: string;
    status: string;
    notes: Array<{
      author: string;
      note: string;
    }>;
  }>;
  bannerImage: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface NewProject {
  name: string;
  summary: string;
  description: string;
  goals: string[];
  numAuthenticators: number;
  authenticators: string[];
  targetWallet: string;
  fundAmount: number;
  deadline: string;
  claimantWebsite: string;
}

export default function TrustFundApp() {

  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [publicKey, setPublicKey] = useState('')


  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("viewProjects");
  const [createProjectStep, setCreateProjectStep] = useState(0);
  const [newProject, setNewProject] = useState<NewProject>({
    name: '',
    summary: '',
    description: '',
    goals: [],
    numAuthenticators: 0,
    authenticators: [],
    targetWallet: '',
    fundAmount: 0,
    deadline: '',
    claimantWebsite: ''
  });

  const topProjects: Project[] = [
    { 
      id: 1, 
      name: "Save the Rainforest", 
      amountHeld: 1000000, 
      amountTarget: 1500000,
      summary: "Protecting Amazon rainforest from deforestation",
      description: "Our project aims to protect 100,000 acres of Amazon rainforest from deforestation. We will work with local communities to implement sustainable farming practices and create economic incentives for forest preservation.",
      claimant: "Amazon Conservation Association",
      claimantWebsite: "https://www.amazonconservation.org",
      authenticatorsPending: 3,
      totalAuthenticators: 5,
      authenticators: [
        { name: "Rainforest Alliance", website: "https://www.rainforest-alliance.org", status: "approved" },
        { name: "World Wildlife Fund", website: "https://www.worldwildlife.org", status: "approved" },
        { name: "Conservation International", website: "https://www.conservation.org", status: "pending" },
        { name: "The Nature Conservancy", website: "https://www.nature.org", status: "pending" },
        { name: "Environmental Defense Fund", website: "https://www.edf.org", status: "pending" },
      ],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      approvalRating: 85,
      donorsCount: 1500,
      objectiveGoals: [
        { 
          goal: "Protect 100,000 acres of rainforest",
          status: "pending",
          notes: [
            { author: "Rainforest Alliance", note: "50,000 acres protected so far. On track to meet goal." },
            { author: "World Wildlife Fund", note: "Negotiations ongoing for additional 30,000 acres." }
          ]
        },
        { 
          goal: "Implement sustainable farming practices in 50 local communities",
          status: "approved",
          notes: [
            { author: "Conservation International", note: "55 communities have adopted new practices. Goal exceeded." },
            { author: "The Nature Conservancy", note: "Confirmed implementation in all 55 communities." },
            { author: "Environmental Defense Fund", note: "Positive impact observed on local ecosystems." }
          ]
        },
        { 
          goal: "Reduce deforestation rate by 30% in target areas",
          status: "pending",
          notes: [
            { author: "The Nature Conservancy", note: "Current reduction is 22%. Additional efforts needed." }
          ]
        },
      ],
      bannerImage: "/images/rainforest.jpg"
    },
    { 
      id: 2, 
      name: "Clean Water Initiative", 
      amountHeld: 750000, 
      amountTarget: 1000000,
      summary: "Providing clean water access to rural communities",
      description: "This project aims to build sustainable water systems in 100 rural villages, providing clean water access to over 50,000 people. We will implement water purification systems and educate communities on water conservation.",
      claimant: "Water for All Foundation",
      claimantWebsite: "https://www.waterforall.org",
      authenticatorsPending: 2,
      totalAuthenticators: 4,
      authenticators: [
        { name: "WaterAid", website: "https://www.wateraid.org", status: "approved" },
        { name: "Charity: Water", website: "https://www.charitywater.org", status: "approved" },
        { name: "Water.org", website: "https://water.org", status: "pending" },
        { name: "Global Water Challenge", website: "https://globalwaterchallenge.org", status: "pending" },
      ],
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      approvalRating: 92,
      donorsCount: 2200,
      objectiveGoals: [
        { 
          goal: "Install water purification systems in 100 villages",
          status: "pending",
          notes: [
            { author: "WaterAid", note: "Systems installed in 60 villages. On track to meet goal." },
            { author: "Charity: Water", note: "Quality checks completed for 55 installations." }
          ]
        },
        { 
          goal: "Conduct water conservation workshops in each village",
          status: "approved",
          notes: [
            { author: "Water.org", note: "Workshops completed in all 100 villages." },
            { author: "Global Water Challenge", note: "Positive feedback received from community leaders." }
          ]
        },
        { 
          goal: "Reduce waterborne diseases by 50% in target areas",
          status: "pending",
          notes: [
            { author: "WaterAid", note: "Initial surveys show 30% reduction. Continued monitoring required." }
          ]
        },
      ],
      bannerImage: "/images/water.jpg"
    },
    { 
      id: 3, 
      name: "Renewable Energy for Schools", 
      amountHeld: 500000, 
      amountTarget: 800000,
      summary: "Implementing solar power systems in underfunded schools",
      description: "Our project aims to install solar power systems in 50 underfunded schools, reducing their energy costs and providing a sustainable power source. We will also educate students on renewable energy technologies.",
      claimant: "Solar Schools Initiative",
      claimantWebsite: "https://www.solarschools.org",
      authenticatorsPending: 1,
      totalAuthenticators: 3,
      authenticators: [
        { name: "Solar Energy International", website: "https://www.solarenergy.org", status: "approved" },
        { name: "The Solar Foundation", website: "https://www.thesolarfoundation.org", status: "approved" },
        { name: "American Solar Energy Society", website: "https://www.ases.org", status: "pending" },
      ],
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      approvalRating: 88,
      donorsCount: 1800,
      objectiveGoals: [
        { 
          goal: "Install solar power systems in 50 schools",
          status: "pending",
          notes: [
            { author: "Solar Energy International", note: "Systems installed in 30 schools. Progress is steady." },
            { author: "The Solar Foundation", note: "Energy output meets or exceeds expectations in all installations." }
          ]
        },
        { 
          goal: "Conduct renewable energy workshops for students",
          status: "approved",
          notes: [
            { author: "American Solar Energy Society", note: "Workshops completed in all 50 schools." },
            { author: "Solar Energy International", note: "Student feedback shows high engagement and interest." }
          ]
        },
        { 
          goal: "Reduce schools' energy costs by 60%",
          status: "pending",
          notes: [
            { author: "The Solar Foundation", note: "Current average reduction is 45%. Optimizing systems for better performance." }
          ]
        },
      ],
      bannerImage: "/images/wind.jpg"
    },
    { 
      id: 4, 
      name: "Urban Reforestation Project", 
      amountHeld: 300000, 
      amountTarget: 600000,
      summary: "Planting trees and creating green spaces in urban areas",
      description: "This project aims to plant 100,000 trees and create 20 new parks in densely populated urban areas. We will improve air quality, reduce the urban heat island effect, and provide green spaces for community well-being.",
      claimant: "Green Cities Alliance",
      claimantWebsite: "https://www.greencitiesalliance.org",
      authenticatorsPending: 2,
      totalAuthenticators: 4,
      authenticators: [
        { name: "American Forests", website: "https://www.americanforests.org", status: "approved" },
        { name: "The Nature Conservancy", website: "https://www.nature.org", status: "approved" },
        { name: "Arbor Day Foundation", website: "https://www.arborday.org", status: "pending" },
        { name: "Trust for Public Land", website: "https://www.tpl.org", status: "pending" },
      ],
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      approvalRating: 90,
      donorsCount: 3500,
      objectiveGoals: [
        { 
          goal: "Plant 100,000 trees in urban areas",
          status: "pending",
          notes: [
            { author: "American Forests", note: "65,000 trees planted so far. On track to meet goal." },
            { author: "The Nature Conservancy", note: "Survival rate of planted trees is 92%, exceeding expectations." }
          ]
        },
        { 
          goal: "Create 20 new urban parks",
          status: "pending",
          notes: [
            { author: "Trust for Public Land", note: "12 parks completed, 5 under construction, 3 in planning phase." },
            { author: "Arbor Day Foundation", note: "Community engagement in park design has been highly successful." }
          ]
        },
        { 
          goal: "Reduce urban heat island effect by 2°C in target areas",
          status: "pending",
          notes: [
            { author: "The Nature Conservancy", note: "Current measurements show 1.5°C reduction. Continued monitoring in progress." }
          ]
        },
      ],
      bannerImage: "/images/urbangreen.jpg"
    },
    { 
      id: 5, 
      name: "Global Education Initiative", 
      amountHeld: 1200000, 
      amountTarget: 2000000,
      summary: "Providing quality education to underprivileged children worldwide",
      description: "Our project aims to build 50 schools in underserved communities across the globe, train 500 teachers, and provide educational materials to 100,000 students. We focus on promoting literacy, STEM education, and digital skills.",
      claimant: "Education for All Foundation",
      claimantWebsite: "https://www.educationforall.org",
      authenticatorsPending: 2,
      totalAuthenticators: 5,
      authenticators: [
        { name: "UNESCO", website: "https://en.unesco.org", status: "approved" },
        { name: "Global Partnership for Education", website: "https://www.globalpartnership.org", status: "approved" },
        { name: "Room to Read", website: "https://www.roomtoread.org", status: "approved" },
        { name: "Teach For All", website: "https://teachforall.org", status: "pending" },
        { name: "World Literacy Foundation", website: "https://worldliteracyfoundation.org", status: "pending" },
      ],
      deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      approvalRating: 95,
      donorsCount: 5000,
      objectiveGoals: [
        { 
          goal: "Build and equip 50 schools in underserved communities",
          status: "pending",
          notes: [
            { author: "UNESCO", note: "30 schools completed and operational. Construction ongoing for remaining 20." },
            { author: "Global Partnership for Education", note: "All completed schools meet or exceed quality standards." }
          ]
        },
        { 
          goal: "Train 500 teachers in modern pedagogical methods",
          status: "approved",
          notes: [
            { author: "Teach For All", note: "550 teachers trained, exceeding the initial goal." },
            { author: "Room to Read", note: "Follow-up assessments show significant improvement in teaching quality." }
          ]
        },
        { 
          goal: "Distribute educational materials to 100,000 students",
          status: "pending",
          notes: [
            { author:  "World Literacy Foundation", note: "75,000 students received materials. Distribution ongoing." },
            { author: "UNESCO", note: "Feedback indicates high engagement with provided materials." }
          ]
        },
        { 
          goal: "Achieve 95% literacy rate in target communities within 5 years",
          status: "pending",
          notes: [
            { author: "Room to Read", note: "Current literacy rate at 82%. Steady progress observed." }
          ]
        },
      ],
      bannerImage: "/images/education.jpg"
    },
  ];

  const [timeLeft, setTimeLeft] = useState<Record<number, TimeLeft>>({});

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await freighter.isConnected()
      if (connected) {
        const allowed = await freighter.isAllowed()
        if (allowed) {
          try {
            const { address } = await freighter.getAddress()
            setPublicKey(address)
            setIsWalletConnected(true)
          } catch (error) {
            console.error('Error getting public key:', error)
          }
        }
      }
    }
    checkConnection()
    const timer = setInterval(() => {
      const now = new Date();
      const updatedTimeLeft = topProjects.reduce((acc, project) => {
        const difference = project.deadline.getTime() - now.getTime();
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        acc[project.id] = { days, hours, minutes, seconds };
        return acc;
      }, {} as Record<number, TimeLeft>);
      setTimeLeft(updatedTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleWalletConnection = async () => {
    if (!isWalletConnected) {
      try {
        const connected = await freighter.isConnected()
        if (!connected) {
          alert('Please install Freighter wallet extension')
          return
        }
        
        const allowed = await freighter.isAllowed()
        if (!allowed) {
          await freighter.setAllowed()
        }
        
        const { address } = await freighter.getAddress()
        setPublicKey(address)
        setIsWalletConnected(true)
      } catch (error) {
        console.error('Error connecting wallet:', error)
        alert('Failed to connect wallet. Please try again.')
      }
    } else {
      // Disconnect logic
      setIsWalletConnected(false)
      setPublicKey('')
    }
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setActiveTab("view");
  };

  const accentColor = darkMode ? "orange" : "green";
  const lightAccentColor = darkMode ? "orange-500" : "green-700";

  const handleCreateProjectNext = () => {
    if (createProjectStep < 3) {
      setCreateProjectStep(createProjectStep + 1);
    }
  };

  const handleCreateProjectPrev = () => {
    if (createProjectStep > 0) {
      setCreateProjectStep(createProjectStep - 1);
    }
  };

  const isCreateProjectStepValid = () => {
    switch (createProjectStep) {
      case 0:
        return newProject.name && newProject.summary && newProject.description;
      case 1:
        return newProject.goals.length > 0;
      case 2:
        return newProject.numAuthenticators > 0 && newProject.authenticators.length > 0;
      case 3:
        return newProject.targetWallet && newProject.fundAmount && newProject.deadline;
      default:
        return false;
    }
  };

  const handleCreateProjectSubmit = () => {
    console.log("New project submitted:", newProject);
    setNewProject({
      name: '',
      summary: '',
      description: '',
      goals: [],
      numAuthenticators: 0,
      authenticators: [],
      targetWallet: '',
      fundAmount: 0,
      deadline: '',
      claimantWebsite: ''
    });
    setCreateProjectStep(0);
    setActiveTab("projects");
  };

  return (
    <div className={`container mx-auto p-4 ${darkMode ? 'dark' : ''}`}>
      <header className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-4">
          <Image src="/images/logo.png" alt="TrustFund Logo" width={70} height={70} className="rounded-full" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">TrustFund</h1>
        </div>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100" onClick={() => setActiveSection("viewProjects")}>View Projects</Button>
          <Button variant="ghost" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100" onClick={() => setActiveSection("authenticatorTools")}>Authenticator Tools</Button>
          <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"onClick={handleWalletConnection}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isWalletConnected ? 'Connected' : 'Connect Wallet'}
            </Button>
          <div className="flex items-center space-x-2">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-500 dark:text-gray-400" />
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="bg-gray-200 dark:bg-gray-700"
            />
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-500 dark:text-gray-400" />
          </div>
        </nav>
      </header>

      {/* Display public key if connected */}
      {isWalletConnected && (
          <div className={`bg-${accentColor}-300 dark:bg-${accentColor}-700 p-2 text-center`}>
            Connected Wallet: GDOMMR..{publicKey.slice(0, 6)}...{publicKey.slice(-6)}
          </div>
        )}


    


      <Alert className="mb-8 border-green-400 bg-green-100 dark:border-orange-900 dark:bg-orange-700">
        <AlertCircle className="h-4 w-4 text-black-600 dark:text-white-400" />
        <AlertTitle className="text-black-800 dark:text-white-200">How TrustFund Works</AlertTitle>
        <AlertDescription className="text-black-600 dark:text-white">
          TrustFund ensures transparency and accountability in charitable projects. Donors contribute to smart contracts, 
          which are overseen by impartial authenticators. Funds are only released when project goals are met and verified. 
          If deadlines are missed, donations are returned to contributors.
        </AlertDescription>
      </Alert>

      {activeSection === "viewProjects" && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full grid-cols-3 bg-green-100 dark:bg-gray-800`}>
          <TabsTrigger value="projects" className="text-gray-600 dark:text-orange-500">Top Projects</TabsTrigger>
            <TabsTrigger value="create" className="text-gray-600 dark:text-orange-500">Create Project</TabsTrigger>
            <TabsTrigger value="view" className="text-gray-600 dark:text-orange-500">View Project</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topProjects.map((project) => (
          <Card key={project.id} className={`cursor-pointer border-${accentColor}-200 dark:border-${accentColor}-800 overflow-hidden rounded-lg`}>
            <div className="relative h-40">
              <Badge 
                variant="outline" 
                className={`absolute top-2 right-2 z-10 bg-${accentColor}-100 text-${lightAccentColor} dark:bg-gray-800 dark:text-${accentColor}-500 rounded-full`}
              >
                {timeLeft[project.id] ? (
                  <>
                    <Clock3 className="w-4 h-4 mr-1" />
                    {`${timeLeft[project.id].days}d ${timeLeft[project.id].hours}h ${timeLeft[project.id].minutes}m ${timeLeft[project.id].seconds}s`}
                  </>
                ) : (
                  'Loading...'
                )}
              </Badge>
              <Image src={project.bannerImage} alt={project.name} layout="fill" objectFit="cover" className="opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <h3 className="text-xl font-bold">{project.name}</h3>
                <p className="text-sm">by {project.claimant}</p>
              </div>
            </div>
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm">{project.summary}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Funds Raised:</span>
                <span className={`text-lg font-bold text-${lightAccentColor}`}>${project.amountHeld.toLocaleString()}</span>
              </div>
              <Progress 
                value={(project.amountHeld / project.amountTarget) * 100} 
                className={`bg-${accentColor}-200 dark:bg-${accentColor}-700`} 
               // indicatorClassName={`bg-${lightAccentColor}`}
              />
              <div className="text-sm text-right">
                Target: ${project.amountTarget.toLocaleString()}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Authenticators:</span>
                <Badge 
                  variant="secondary" 
                  className={`bg-${accentColor}-200 text-${lightAccentColor} dark:bg-${accentColor}-900 dark:text-${accentColor}-500 rounded-full`}
                >
                  {project.authenticatorsPending} pending / {project.totalAuthenticators} total
                </Badge>
              </div>
              <div className="space-y-2">
                <h4 className={`text-sm font-semibold text-${lightAccentColor}`}>Objective Goals:</h4>
                <ul className="text-sm space-y-1">
                  {project.objectiveGoals.slice(0, 3).map((goal, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      {goal.status === "approved" ? (
                        <CheckCircle2 className={`h-4 w-4 text-${accentColor}-500`} />
                      ) : (
                        <Clock3 className="h-4 w-4 text-yellow-500" />
                      )}
                      <span>{goal.goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
            <Button 
              onClick={() => handleProjectClick(project)} 
              className={`bg-${lightAccentColor} hover:bg-${accentColor}-600 text-black dark:text-orange-400 border border-${lightAccentColor} rounded-full`}
            >
              More Info <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </TabsContent>
    
          <TabsContent value="create">
            <Card className={`border-${accentColor}-200 dark:border-${accentColor}-800`}>
              <CardHeader>
                <CardTitle className={`text-${lightAccentColor}`}>Create New Project</CardTitle>
                <CardDescription>Deploy a new smart contract for your project</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={`step-${createProjectStep}`} className="w-full">
                  <TabsList>
                    <TabsTrigger value="step-0" disabled>Project Info</TabsTrigger>
                    <TabsTrigger value="step-1" disabled>Project Goals</TabsTrigger>
                    <TabsTrigger value="step-2" disabled>Authenticators</TabsTrigger>
                    <TabsTrigger value="step-3" disabled>Funding</TabsTrigger>
                  </TabsList>
                  <TabsContent value="step-0">
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input 
                          id="project-name" 
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          placeholder="Enter project name" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project-summary">Project Summary</Label>
                        <Textarea 
                          id="project-summary" 
                          value={newProject.summary}
                          onChange={(e) => setNewProject({...newProject, summary: e.target.value})}
                          placeholder="Briefly describe your project" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project-description">Detailed Description</Label>
                        <Textarea 
                          id="project-description"
                          value={newProject.description}
                          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                          placeholder="Provide a detailed description of your project" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claimant-website">Claimant Website</Label>
                        <Input 
                          id="claimant-website" 
                          value={newProject.claimantWebsite}
                          onChange={(e) => setNewProject({...newProject, claimantWebsite: e.target.value})}
                          placeholder="Enter claimant website URL" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="step-1">
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-goals">Project Goals</Label>
                        <Textarea 
                          id="project-goals" 
                          value={newProject.goals.join('\n')}
                          onChange={(e) => setNewProject({...newProject, goals: e.target.value.split('\n').filter(goal => goal.trim() !== '')})}
                          placeholder="List your project goals, one per line" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="step-2">
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="num-authenticators">Number of Randomly Selected Authenticators</Label>
                        <Input 
                          id="num-authenticators" 
                          type="number"
                          value={newProject.numAuthenticators}
                          onChange={(e) => setNewProject({...newProject, numAuthenticators: parseInt(e.target.value)})}
                          placeholder="Enter number of authenticators" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="authenticators">Potential Authenticator Addresses</Label>
                        <Textarea 
                          id="authenticators" 
                          value={newProject.authenticators.join('\n')}
                          onChange={(e) => setNewProject({...newProject, authenticators: e.target.value.split('\n').filter(auth => auth.trim() !== '')})}
                          placeholder="Enter authenticator addresses, separated by new lines" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="step-3">
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="target-wallet">Target Wallet for Funds</Label>
                        <Input 
                          id="target-wallet" 
                          value={newProject.targetWallet}
                          onChange={(e) => setNewProject({...newProject, targetWallet: e.target.value})}
                          placeholder="Enter target wallet address" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fund-amount">Fund Amount (ETH)</Label>
                        <Input 
                          id="fund-amount" 
                          type="number"
                          value={newProject.fundAmount}
                          onChange={(e) => setNewProject({...newProject, fundAmount: parseFloat(e.target.value)})}
                          placeholder="Enter fund amount" 
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Return Funds Deadline</Label>
                        <Input 
                          id="deadline" 
                          type="datetime-local"
                          value={newProject.deadline}
                          onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                          className={`border-${accentColor}-200 dark:border-${accentColor}-800`} 
                        />
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
                <div className="mt-6 flex justify-between">
                  <Button 
                    onClick={handleCreateProjectPrev} 
                    disabled={createProjectStep === 0}
                    variant="outline" 
                    className={`border-${lightAccentColor} text-${lightAccentColor}`}
                  >
                    Previous
                  </Button>
                  {createProjectStep < 3 ? (
                    <Button 
                      onClick={handleCreateProjectNext} 
                      disabled={!isCreateProjectStepValid()}
                      className={`bg-gray-800 hover:bg-${accentColor}-600 text-black dark:text-orange-600`}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCreateProjectSubmit} 
                      disabled={!isCreateProjectStepValid()}
                      className={`dark:bg-gray-800 hover:bg-${accentColor}-600 text-black dark:text-orange-600`}
                    >
                      Deploy Smart Contract
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="view">
            {selectedProject ? (
              <Card className={`border-${accentColor}-200 dark:border-${accentColor}-800`}>
                <div className="relative h-60">
                  <Image src={selectedProject.bannerImage} alt={selectedProject.name} layout="fill" objectFit="cover" className="opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
                  <div className="absolute bottom-0 left-0 p-6 text-white">
                    <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
                    <p className="text-xl">by {selectedProject.claimant}</p>
                  </div>
                </div>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Project Description</h3>
                    <p>{selectedProject.description}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Claimant</h3>
                    <div className="flex items-center space-x-2">
                      <Target className={`h-5 w-5 text-${lightAccentColor}`} />
                      <span>{selectedProject.claimant}</span>
                    </div>
                    <Link href={selectedProject.claimantWebsite} target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-1 text-${lightAccentColor} hover:underline`}>
                      <span>Visit project website</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Funding Progress</h3>
                    <div className="flex items-center space-x-2">
                      <DollarSign className={`h-5 w-5 text-${lightAccentColor}`} />
                      <span className="text-2xl font-bold">${selectedProject.amountHeld.toLocaleString()} / ${selectedProject.amountTarget.toLocaleString()}</span>
                    </div>
                    <Progress value={(selectedProject.amountHeld / selectedProject.amountTarget) * 100} className={`bg-${accentColor}-200 dark:bg-${accentColor}-700`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Authenticators</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className={`h-5 w-5 text-${lightAccentColor}`} />
                      <span>{selectedProject.authenticatorsPending} pending / {selectedProject.totalAuthenticators} total</span>
                    </div>
                    <ul className="space-y-2">
                      {selectedProject.authenticators.map((auth, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span>{auth.name}</span>
                          <div className="flex items-center space-x-2">
                            <Link href={auth.website} target="_blank" rel="noopener noreferrer" className={`text-${lightAccentColor} hover:underline flex items-center space-x-1`}>
                              <span>Website</span>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            {auth.status === "approved" ? (
                              <CheckCircle2 className={`h-5 w-5 text-${accentColor}-500`} />
                            ) : (
                              <Clock3 className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Time Remaining</h3>
                    <div className="flex items-center space-x-2">
                      <Clock className={`h-5 w-5 text-${lightAccentColor}`} />
                      <span className="font-mono">
                        {timeLeft[selectedProject.id] ? 
                          `${timeLeft[selectedProject.id].days}d ${timeLeft[selectedProject.id].hours}h ${timeLeft[selectedProject.id].minutes}m ${timeLeft[selectedProject.id].seconds}s` : 
                          'Loading...'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Project Status</h3>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span>Pending approval</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Approval Rating</h3>
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className={`h-5 w-5 text-${lightAccentColor}`} />
                      <span>{selectedProject.approvalRating}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Total Donors</h3>
                    <div className="flex items-center space-x-2">
                      <Users className={`h-5 w-5 text-${lightAccentColor}`} />
                      <span>{selectedProject.donorsCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Objective Project Goals for Fund Release</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {selectedProject.objectiveGoals.map((goal, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center space-x-2">
                              {goal.status === "approved" ? (
                                <CheckCircle2 className={`h-5 w-5 text-${accentColor}-500`} />
                              ) : (
                                <Clock3 className="h-5 w-5 text-yellow-500" />
                              )}
                              <span>{goal.goal}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {goal.notes.map((note, noteIndex) => (
                                <li key={noteIndex} className="text-sm">
                                  <span className="font-semibold">{note.author}:</span> {note.note}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button className={`bg-${lightAccentColor} hover:bg-${accentColor}-600 text-black dark:text-orange-600`}>Donate to This Project</Button>
                  <Button variant="outline" className={`border-${lightAccentColor} text-${lightAccentColor}`}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Project
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className={`border-${accentColor}-200 dark:border-${accentColor}-800`}>
                <CardContent className="text-center py-10">
                  <p>Select a project from the Top Projects tab to view details</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {activeSection === "authenticatorTools" && (
        <Card className={`border-${accentColor}-200 dark:border-${accentColor}-800`}>
          <CardHeader>
            <CardTitle className={`text-${lightAccentColor}`}>Authenticator Tools</CardTitle>
            <CardDescription>Manage and authenticate projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-select">Select Project to Authenticate</Label>
                <Select>
                  <SelectTrigger className={`w-full border-${accentColor}-200 dark:border-${accentColor}-800`}>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {topProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Project Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Funds Raised</p>
                    <p className={`text-lg font-bold text-${lightAccentColor}`}>$750,000 / $1,000,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                    <p className={`text-lg font-bold text-${lightAccentColor}`}>15 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Authenticators</p>
                    <p className={`text-lg font-bold text-${lightAccentColor}`}>5 / 7 Approved</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approval Rating</p>
                    <p className={`text-lg font-bold  text-${lightAccentColor}`}>92%</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className={`text-lg font-semibold text-${lightAccentColor}`}>Objective Project Goals</h3>
                <Accordion type="single" collapsible className="w-full">
                  {topProjects[0].objectiveGoals.map((goal, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center space-x-2">
                          {goal.status === "approved" ? (
                            <CheckCircle2 className={`h-5 w-5 text-${accentColor}-500`} />
                          ) : (
                            <Clock3 className="h-5 w-5 text-yellow-500" />
                          )}
                          <span>{goal.goal}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {goal.notes.map((note, noteIndex) => (
                            <li key={noteIndex} className="text-sm">
                              <span className="font-semibold">{note.author}:</span> {note.note}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2">
                          <Label htmlFor={`goal-note-${index}`}>Add Note</Label>
                          <Textarea id={`goal-note-${index}`} placeholder="Enter your note on this goal" className={`mt-1 border-${accentColor}-200 dark:border-${accentColor}-800`} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authentication-notes">Overall Authentication Notes</Label>
                <Textarea id="authentication-notes" placeholder="Enter your overall notes and observations" className={`border-${accentColor}-200 dark:border-${accentColor}-800`} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" className={`border-${lightAccentColor} text-${lightAccentColor} hover:bg-${accentColor}-50`}>Request More Information</Button>
                <Button className={`bg-${lightAccentColor} hover:bg-${accentColor}-600 text-black dark:text-orange-600`}>Authenticate Project</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}