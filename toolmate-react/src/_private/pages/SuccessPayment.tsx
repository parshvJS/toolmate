import Confetti from 'react-confetti'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, CreditCard } from 'lucide-react';
import MateyExpression from '@/components/custom/MateyExpression';

export default function SuccessPayment() {
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const queryParams = new URLSearchParams(window.location.search);
    const ba_token = queryParams.get('ba_token');
    const subscription_id = queryParams.get('subscription_id');
    const [planData, setPlanData] = useState<any>();
    const navigate = useNavigate();
    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('paypalData') || '{}');
        console.log(data, "data");
        if (ba_token && data) {
            const localToken = data.ba;
            if (localToken === ba_token) {
                setPlanData(data);
            }
        }
        console.log(ba_token, subscription_id, planData, "ba_token, subscription_id, planData");
    }, [ba_token, subscription_id])


    return (
        <div className="flex justify-center items-center h-screen">
            <Confetti
                width={dimensions.width}
                height={dimensions.height}
                recycle={false}
            />

            <div className='flex w-full h-full items-center justify-center'>
                {/* card */}
                <div className='shadow-md p-4 rounded-lg border border-slate-400 bg-gradient-to-tr from-paleYellow to-mangoYellow'>
                    <div className='flex gap-2 items-center'>
                        <MateyExpression expression='2thumb' />

                        <div className='flex flex-col  items-start leading-4'>
                            <p className='font-semibold text-xl'>Plan Subscription Successfull</p>
                            <p className='text-slate-500'>Payment Completed</p>
                        </div>
                    </div>
                    {/* info */}
                    {
                        planData &&
                        <div className='border-t-2 border-slate-700 my-4'>
                            <div className='flex flex-col gap-2 mt-4 items-start font-semibold text-xl'>
                                <p> Subscribed To {planData.Packname}</p>
                                <p className='text-slate-600  font-medium'>{planData.price}</p>
                            </div>
                        </div>
                    }

                    <div
                        onClick={() => navigate('/dashboard')}
                        className='flex justify-center items-center mt-4 gap-2 bg-yellow px-4 py-2 rounded-md font-semibold hover:bg-lightYellow cursor-pointer'>
                        <CircleCheck size={22} />
                        Go To Dashboard
                    </div>
                    <div
                        onClick={() => navigate('/manage-subscription')}
                        className='flex justify-center items-center mt-2 gap-2 bg-yellow/40 px-4 py-2 rounded-md font-semibold hover:bg-lightYellow cursor-pointer'>
                        <CreditCard  size={22} />
                        Manage Subscription
                    </div>
                </div>


            </div>
        </div>
    )
}