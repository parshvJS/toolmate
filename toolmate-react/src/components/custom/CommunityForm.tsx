'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Paintbrush,
  Users,
  Tag,
  MapPin,
  Globe,
  Hammer,
  Scissors,
  PenTool,
  Image as ImageIcon,
  FileImage,
  Wrench
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    window.addEventListener("resize", listener)
    return () => window.removeEventListener("resize", listener)
  }, [matches, query])

  return matches
}

const formSteps = [
  {
    title: "Craft Your Space",
    icon: <Paintbrush className="w-6 h-6" />,
    fields: [
      { name: "communityName", label: "Community Name", type: "input", icon: <PenTool className="w-4 h-4" /> },
      { name: "description", label: "Description", type: "textarea", icon: <Scissors className="w-4 h-4" /> },
      { name: "profileImage", label: "Profile Image", type: "file", icon: <ImageIcon className="w-4 h-4" /> },
      { name: "bannerImage", label: "Banner Image", type: "file", icon: <FileImage className="w-4 h-4" /> },
    ],
  },
  {
    title: "Build Your Community",
    icon: <Users className="w-6 h-6" />,
    fields: [
      { name: "communityType", label: "Community Type", type: "radio", options: ["Public", "Private"], icon: <Wrench className="w-4 h-4" /> },
      { name: "tags", label: "Tags", type: "input", icon: <Tag className="w-4 h-4" /> },
      { name: "city", label: "City (Optional)", type: "input", icon: <MapPin className="w-4 h-4" /> },
      { name: "country", label: "Country (Optional)", type: "input", icon: <Globe className="w-4 h-4" /> },
    ],
  },
  {
    title: "Final Touches",
    icon: <Hammer className="w-6 h-6" />,
    fields: [
      { name: "sponsored", label: "Sponsored", type: "switch", icon: <Tag className="w-4 h-4" /> },
    ],
  },
]

export default function DIYCommunityCreationDialog({
  collabsable = false,
}: {
  collabsable?: boolean
}) {
  const [step, setStep] = useState(1)
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState(0)
  const isMobile = useMediaQuery("(max-width: 640px)")

  const totalSteps = formSteps.length

  const nextStep = () => {
    setDirection(1)
    setStep(prev => Math.min(prev + 1, totalSteps))
  }

  const prevStep = () => {
    setDirection(-1)
    setStep(prev => Math.max(prev - 1, 1))
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-4">
        {formSteps.map((formStep, index) => (
          <motion.div
            key={index}
            className={`flex flex-col items-center ${index + 1 <= step ? 'text-yellow-600' : 'text-gray-400'
              }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center mb-2 ${index + 1 <= step ? 'border-yellow bg-paleYellow' : 'border-slate-300 bg-slate-100'
              }`}>
              {formStep.icon}
            </div>
            <div className="text-sm font-medium text-center">{formStep.title}</div>
          </motion.div>
        ))}
      </div>
      <div className="relative">
        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-200">
          <motion.div
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )

  const FormContent = () => (
    <div className="mt-4">
      <ProgressBar />
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.5 }}
        >
          <div className="space-y-6">
            {formSteps[step - 1].fields.map((field, index) => (
              <div key={index} className="relative">
                <Label htmlFor={field.name} className="flex items-center text-lg font-medium mb-2">
                  {field.icon}
                  <span className="ml-2">{field.label}</span>
                </Label>
                {field.type === 'input' && (
                  <Input id={field.name} placeholder={`Enter ${field.label.toLowerCase()}`} className="pl-10 bg-gray-50 border-2 border-gray-200 focus:border-yellow" />
                )}
                {field.type === 'textarea' && (
                  <Textarea id={field.name} placeholder={`Enter ${field.label.toLowerCase()}`} className="pl-10 bg-gray-50 border-2 border-gray-200 focus:border-yellow" />
                )}
                {field.type === 'file' && (
                  <div className="mt-1 flex items-center">
                    <Button variant="outline" size="lg" className="bg-gray-50 border-2 border-gray-200 hover:bg-teal-50 hover:border-yellow">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {field.label}
                    </Button>
                  </div>
                )}
                {field.type === 'radio' && (
                  <RadioGroup defaultValue="public" className="flex space-x-4">
                    {field.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2 bg-gray-50 border-2 border-gray-200 rounded-md p-3 hover:bg-teal-50 hover:border-yellow">
                        <RadioGroupItem value={option.toLowerCase()} id={option.toLowerCase()} />
                        <Label htmlFor={option.toLowerCase()}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {field.type === 'switch' && (
                  <div className="flex items-center space-x-2 bg-gray-50 border-2 border-gray-200 rounded-md p-3">
                    <Switch id={field.name} />
                    <Label htmlFor={field.name}>{field.label}</Label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex justify-between">
        <Button
          onClick={prevStep}
          disabled={step === 1}
          variant="outline"
          size="lg"
          className="bg-gray-50 border-2 border-gray-200 hover:bg-teal-50 hover:border-yellow"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={step === totalSteps ? () => { } : nextStep}
          size="lg"
          className="bg-yellow text-white hover:bg-softYellow"
        >
          {step === totalSteps ? 'Create Community' : 'Next'}
          {step !== totalSteps && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>
            <button>
              <img
                src="/assets/matey-emoji/newComm.svg"
                alt="new chat"
                className="p-1 bg-mangoYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer"
              />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Create Your DIY Community</DrawerTitle>
            </DrawerHeader>
            <div className="p-6">
              <FormContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <TooltipProvider>
            <Tooltip delayDuration={70}>
              <TooltipTrigger className={`${collabsable ? "block" : "hidden"}`}>
                <button onClick={() => setOpen(!open)} className={`${collabsable ? "flex" : "hidden"} mt-1`}>
                  <img
                    src="/assets/matey-emoji/newComm.svg"
                    alt="new chat"
                    className="p-1 bg-mangoYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-paleYellow">
                <p>Create New Community</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>


          <button onClick={() => setOpen(!open)} className={`${collabsable ? "hidden" : "flex"}  mt-1  gap-3 items-center bg-mangoYellow px-3 rounded-lg hover:bg-softYellow transition duration-300 ease-in-out`}>
            <img src="/assets/matey-emoji/newComm.svg" alt="new chat" className="w-12 h-12" />
            <p className="font-semibold">New Community</p>
          </button>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Your DIY Community</DialogTitle>
            </DialogHeader>
            <FormContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}