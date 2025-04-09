import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from 'react-hot-toast';
import FileUpload from "@/components/ui/FileUpload";


export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  return (

    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <div className="flex flex-col item-center text-center ">
          <div className="flex items-center justify-center ">
            <h1 className="mr-3 text-5xl font-semibold">
              Chat with PDF
            </h1>
            <UserButton afterSignOutUrl="/" />
          </div>
          <div className="flex m-2 ">
            {
              isAuth && <Button className=" mt-1 mr-4" >Go To Chats</Button>
            }
            <p className="max-w-xl mt-1 text-x-lg text-slate-600">Join millions of Students, researchers and professionals to instantly answer question and understand AI</p>

          </div>
          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload />
            ) : (
              <Link href="/sign-in">
                <Button>Login to get started<LogIn className="w-4 h-4 ml-2" /></Button>
              </Link>
            )
            }
          </div>
        </div>
      </div >
    </div >
  );
}
