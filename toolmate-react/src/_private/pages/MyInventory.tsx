import MateyExpression from "@/components/custom/MateyExpression";
import { CircleHelp, LoaderPinwheel, Pencil, Plus, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/userContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface IToolItem {
    _id: string,
    name: string,
    description: string
    count: number,
    tags: string[]
}


export default function MyInventory() {
    const [currDelIndex, setCurrDelIndex] = useState<string>("");
    const [delDialogOpen, setDelDialogOpen] = useState<boolean>(false);
    const [userToolInventory, setUserToolInventory] = useState<IToolItem[]>([]);
    const [isToolInventoryLoading, setIsToolInventoryLoading] = useState<boolean>(false);
    const [isDeleteToolLoading, setIsDeleteToolLoading] = useState<boolean>(false);
    const [isCreateNewDialogOpen, setIsCreateNewDialogOpen] = useState<boolean>(false);
    //create new tool stats
    const { userData } = useContext(UserContext);
    const [isCreateNewToolLoading, setIsCreateNewToolLoading] = useState<boolean>(false);
    const [toolName, setToolName] = useState<string>("");
    const [toolDescription, setToolDescription] = useState<string>("");
    const [toolTags, setToolTags] = useState<string>("");
    const [toolCount, setToolCount] = useState<number>(-1);
    // edit product

    const [isEditToolLoading, setIsEditToolLoading] = useState<boolean>(false);
    const [isEditToolDialogOpen, setIsEditToolDialogOpen] = useState<boolean>(false);
    const [currEditIndex, setCurrEditIndex] = useState<string>("");
    const { toast } = useToast()

    function handleEditbuttonClick(index: string) {
        setCurrEditIndex(index);
        setIsEditToolDialogOpen(true);
        createNewProduct.setValue("name", userToolInventory?.find(item => item._id == index)?.name || "")
        createNewProduct.setValue("description", userToolInventory?.find(item => item._id == index)?.description || "")
        createNewProduct.setValue("tags", userToolInventory?.find(item => item._id == index)?.tags.toString() || "")
        createNewProduct.setValue("count", userToolInventory?.find(item => item._id == index)?.count || 0)
        createNewProduct.clearErrors()
    }


    async function handleUpdateTool(values: z.infer<typeof createNewProductSchema>) {
        console.log(values)
        setIsCreateNewToolLoading(true);
        const newTool = {
            toolName: values.name,
            toolDescription: values.description,
            tags: values.tags,
            toolCount: values.count,
            toolId: currEditIndex,
            userId: userData?.id
        }
        try {
            const newToolItem = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/editToolItem`, newTool)
            if (newToolItem.data.success) {
                toast({
                    title: "Success",
                    description: "Tool updated successfully",
                    variant: "success"
                })
                setUserToolInventory(userToolInventory.map(item => item._id == currEditIndex ? newToolItem.data.data : item))
                setIsCreateNewToolLoading(false)
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to update tool",
                    variant: "destructive"
                })
                setIsCreateNewToolLoading(false)
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to add tool",
                variant: "destructive"
            })
            setIsCreateNewToolLoading(false)


        }
        setIsEditToolDialogOpen(false)
        setCurrEditIndex("")
        createNewProduct.reset()
    }



    // activate delete dialog
    function handleDeleteTool(index: string) {
        setCurrDelIndex(index);
        setDelDialogOpen(true);
    }

    //  delete item api call
    async function handleDeleteItem(_id: string) {

        setIsDeleteToolLoading(true);
        const deleteItem = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/deleteToolItem`, {
            userId: userData?.id,
            toolId: _id
        })
        if (deleteItem.data.success) {
            setIsDeleteToolLoading(false)
            setDelDialogOpen(false)
            setUserToolInventory(userToolInventory.filter(item => item._id !== _id))
            return;
        }
        else {
            toast({
                title: "Error",
                description: "Failed to delete item",
                variant: "destructive"
            })
            setIsDeleteToolLoading(false)
            setDelDialogOpen(false)
            return;
        }



    }

    async function getToolList() {
        if (userData?.id) {
            setIsToolInventoryLoading(true)
            const userToolList = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getUserToolItem`, {
                userId: userData.id
            })
            if (userToolList.data.success) {
                setUserToolInventory(userToolList.data.data)
                setIsToolInventoryLoading(false)

            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to get user tool inventory",
                    variant: "destructive"
                })
                setIsToolInventoryLoading(false)
            }
        }
    }

    useEffect(() => {
        getToolList()
    }, [userData?.id])

    async function createNewTool(values: z.infer<typeof createNewProductSchema>) {
        setIsCreateNewToolLoading(true)
        if (userData?.id) {
            const newTool = {
                toolName: values.name,
                toolDescription: values.description,
                tags: values.tags,
                toolCount: values.count,
                userId: userData?.id
            }
            console.log(newTool)

            const addNewTool = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/createNewToolItem`, newTool)
            if (addNewTool.data.success) {
                toast({
                    title: "Success",
                    description: "Tool added successfully",
                    variant: "success"
                })

                setUserToolInventory([...userToolInventory, addNewTool.data.data])
                setIsCreateNewToolLoading(false)
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to add tool",
                    variant: "destructive"
                })
                setIsCreateNewToolLoading(false)
            }

        }
        else {
            toast({
                title: "Error",
                description: "You need to be logged in to add a tool",
                variant: "destructive"
            })
            setIsCreateNewToolLoading(false)
        }
        setIsCreateNewDialogOpen(false)
        createNewProduct.reset()
    }

    const createNewProductSchema = z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().min(10, "Please Provide Detailed Description!").max(100, "Description is too long! Max 100 characters"),
        tags: z.string().min(1, "Please Provide Aleast 1 Tag"),
        count: z.coerce.number()
    })

    const createNewProduct = useForm<z.infer<typeof createNewProductSchema>>({
        resolver: zodResolver(createNewProductSchema),
        defaultValues: {
            name: "",
            description: "",
            tags: "",
            count: 0
        },
    })


    return (
        <div className="flex flex-col w-full h-full gap-2 p-5">

            {/* label */}
            <div className="flex gap-4 items-center justify-between">
                <div className="flex gap-2 items-center">
                    <MateyExpression expression="hello" />
                    <div className="flex gap-0 flex-col text-left">
                        <div className="flex gap-2">
                            <p className="font-semibold md:text-xl text-md">Your Tool inventory</p>
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleHelp className="w-4 h-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-yellow font-semibold">
                                        <div className="text-center">
                                            <p className="capitalize">Matey analyzes all your tools  <br /> to provide the best utility and <br /> recommendations during your chats.</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>



                        </div>
                        <p className="md:block hidden">Matey will remember all your tools to provide the best utility in chat.</p>
                    </div>
                </div>
                <div>
                    <Dialog open={isCreateNewDialogOpen} onOpenChange={setIsCreateNewDialogOpen}>
                        <DialogTrigger>
                            <div className="px-3 py-1 text-white rounded-md  bg-gradient-to-r from-orange to-lightOrange">
                                <div className="flex items-center  font-semibold gap-2">
                                    <Plus className="md:block hidden" />
                                    <p>Add New Material Or Tool </p>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <Form {...createNewProduct}>
                                    <form onSubmit={createNewProduct.handleSubmit(createNewTool)} className="s">
                                        <div className="flex gap-2 items-center">
                                            <MateyExpression expression="tool" />
                                            <div className="flex gap-0 flex-col text-left">
                                                <p className="font-semibold md:text-xl text-md">Create New Tool</p>
                                                <p className="md:block hidden">Please provide accurate information about your tools for better analysis for matey</p>
                                            </div>

                                        </div>
                                        <FormField
                                            control={createNewProduct.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tool Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="shadcn" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={createNewProduct.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tool Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="shadcn" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={createNewProduct.control}
                                            name="tags"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tool Tags</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Power tool, Drill  " {...field} />
                                                    </FormControl>
                                                    <FormDescription>Seperate tags with a comma</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={createNewProduct.control}
                                            name="count"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tool Count</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="2" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="bg-orange font-semibold">{
                                            isCreateNewToolLoading ? <div>
                                                <LoaderPinwheel className="animate-spin" />
                                            </div> : "Add Tool"
                                        }</Button>
                                    </form>
                                </Form>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <hr className="w-full border border-slate-400" />
            <div className={`w-full h-full ${userToolInventory.length !== 0 ? 'grid' : ''} md:grid-cols-4 grid-cols-2 gap-2`}>
                {
                    isToolInventoryLoading ?
                        <div className="flex items-center justify-center col-span-4">
                            <LoaderPinwheel className="animate-spin" />
                        </div>
                        :
                        userToolInventory.length == 0 ?
                            <div className="flex flex-col gap-2 items-center justify-center w-full h-full  ">
                                <img
                                    src="/assets/icons/empty-placeholder.svg"
                                    alt="empty-placeholder"
                                    className="w-72 h-72"
                                />

                                <p className="font-semibold text-lg">No Tools Found</p>
                                <p className="text-center">You have not added any tools yet. Click on the button above to add a new tool</p>

                            </div>
                            :
                            userToolInventory.map((item, index) => (
                                <div key={index} className="flex items-start p-3 flex-col gap-2 md:h-fit bg-gradient-to-bl from-lightYellow via-white to-white hover:border-yellow transition-all duration-200 ease-in-out cursor-pointer rounded-md border-2 border-slate-300">
                                    <div className="flex items-center gap-3">
                                        <p className="font-semibold text-black text-lg"> {item.name.length > 25 ? item.name.slice(0, 22) + "...." : item.name}</p>
                                        <p className={`${item.count == -1 ? "hidden" : ""} text-left text-slate-500 font-semibold`}>{item.count} In Stock</p>
                                    </div>
                                    <p className="text-left leading-tight">{item.description.length > 30 ? item.description.slice(0, 30) + "...." : item.description}</p>

                                    <div className="flex gap-2">
                                        <AlertDialog open={item._id == currDelIndex ? true : false && delDialogOpen} onOpenChange={setDelDialogOpen}>
                                            <AlertDialogTrigger>
                                                <div onClick={() => {
                                                    handleDeleteTool(item._id)
                                                }} className="p-1 hover:bg-red-400 transition-all duration-200 rounded-full text-slate-600 hover:text-white">
                                                    <Trash2 className="w-5 h-5  " />
                                                </div>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{item.name}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {
                                                            item.description.length > 70 ? item.description.slice(0, 70) + "..." : item.description
                                                        }
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => {
                                                        setCurrDelIndex("")
                                                        setDelDialogOpen(false)
                                                    }}>Close</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-400 text-white"
                                                        onClick={() => {
                                                            handleDeleteItem(item._id)
                                                        }}
                                                    >Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>


                                        <div>
                                            <Dialog open={item._id == currEditIndex ? true : false && isEditToolDialogOpen} onOpenChange={(value) => {
                                                setIsEditToolDialogOpen(false)
                                                if (value == false) {
                                                    setCurrEditIndex("")
                                                }
                                            }}>
                                                <DialogTrigger>
                                                    <div onClick={() => { handleEditbuttonClick(item._id) }} className="p-1 hover:bg-red-400 -mb-2 transition-all duration-200 rounded-full text-slate-600 hover:text-white">
                                                        <Pencil className="w-5 h-5  " />
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <Form {...createNewProduct}>
                                                            <form onSubmit={createNewProduct.handleSubmit(handleUpdateTool)} className="s">
                                                                <div className="flex gap-2 items-center">
                                                                    <MateyExpression expression="tool" />
                                                                    <div className="flex gap-0 flex-col text-left">
                                                                        <p className="font-semibold md:text-xl text-md">Create New Tool</p>
                                                                        <p className="md:block hidden">Please provide accurate information about your tools for better analysis for matey</p>
                                                                    </div>

                                                                </div>
                                                                <FormField
                                                                    control={createNewProduct.control}
                                                                    name="name"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Tool Name</FormLabel>
                                                                            <FormControl>
                                                                                <Input placeholder={item.name} {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={createNewProduct.control}
                                                                    name="description"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Tool Description</FormLabel>
                                                                            <FormControl>
                                                                                <Input placeholder={item.description} {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={createNewProduct.control}
                                                                    name="tags"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Tool Tags</FormLabel>
                                                                            <FormControl>
                                                                                <Input placeholder={item.tags.toString()} {...field} />
                                                                            </FormControl>
                                                                            <FormDescription>Seperate tags with a comma</FormDescription>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={createNewProduct.control}
                                                                    name="count"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Tool Count</FormLabel>
                                                                            <FormControl>
                                                                                <Input type="number" placeholder={item.count.toString()} {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <Button type="submit" className="bg-orange font-semibold">{
                                                                    isCreateNewToolLoading ? <div>
                                                                        <LoaderPinwheel className="animate-spin" />
                                                                    </div> : "Edit Product Or Material"
                                                                }</Button>
                                                            </form>
                                                        </Form>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            ))
                }
            </div>
        </div>
    )
}