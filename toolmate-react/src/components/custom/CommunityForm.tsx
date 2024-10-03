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
import { ChevronRight, ChevronLeft, Upload, Check } from 'lucide-react'

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
    title: "Basic Information",
    fields: [
      { name: "communityName", label: "Community Name", type: "input" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "profileImage", label: "Profile Image", type: "file" },
      { name: "bannerImage", label: "Banner Image", type: "file" },
    ],
  },
  {
    title: "Community Details",
    fields: [
      { name: "communityType", label: "Community Type", type: "radio", options: ["Public", "Private"] },
      { name: "tags", label: "Tags", type: "input" },
      { name: "city", label: "City (Optional)", type: "input" },
      { name: "country", label: "Country (Optional)", type: "input" },
    ],
  },
  {
    title: "Additional Features",
    fields: [
      { name: "sponsored", label: "Sponsored", type: "switch" },
    ],
  },
]

export default function CommunityCreationDialog() {
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
      <div className="flex justify-between mb-2">
        {formSteps.map((formStep, index) => (
          <motion.div
            key={index}
            className={`text-sm font-medium ${
              index + 1 <= step ? 'text-yellow  ' : 'text-slate-400'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {formStep.title}
          </motion.div>
        ))}
      </div>
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-200">
          <motion.div
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow border-yellow border-2"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between">
          {formSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                index + 1 <= step ? 'border-yellow bg-yellow' : 'border-slate-400 bg-white'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 500, damping: 30 }}
            >
              {index + 1 <= step && (
                <Check className="w-3 h-3 text-white" />
              )}
            </motion.div>
          ))}
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
          <div className="space-y-4">
            {formSteps[step - 1].fields.map((field, index) => (
              <div key={index}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'input' && (
                  <Input id={field.name} placeholder={`Enter ${field.label.toLowerCase()}`} />
                )}
                {field.type === 'textarea' && (
                  <Textarea id={field.name} placeholder={`Enter ${field.label.toLowerCase()}`} />
                )}
                {field.type === 'file' && (
                  <div className="mt-1 flex items-center">
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                )}
                {field.type === 'radio' && (
                  <RadioGroup defaultValue="public">
                    {field.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.toLowerCase()} id={option.toLowerCase()} />
                        <Label htmlFor={option.toLowerCase()}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {field.type === 'switch' && (
                  <div className="flex items-center space-x-2">
                    <Switch id={field.name} />
                    <Label htmlFor={field.name}>{field.label}</Label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-between">
        <Button
          onClick={prevStep}
          disabled={step === 1}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={step === totalSteps ? () => {} : nextStep} className="bg-lightYellow text-black hover:bg-yellow">
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
            <Button className="bg-lightYellow text-black hover:bg-yellow">Create Community</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Create a New Community</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <FormContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)} className="bg-lightYellow text-black hover:bg-yellow">Create Community</Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create a New Community</DialogTitle>
            </DialogHeader>
            <FormContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}