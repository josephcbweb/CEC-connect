import React from "react";
import {useState} from "react";

const Signup = () => {

  const [inputValue,setInputValue] = useState({
    name:"",
    password:"",
    confirmPassword:""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>{}

  return (
    <div className="h-screen w-screen flex items-center justify-center p-[4px]">
      <div className="flex w-[25rem] h-[40rem] m-[1rem] md:w-[55rem] md:shadow-xl rounded-[1rem]">
          <div className="relative flex flex-col items-center justify-center p-5 w-full h-full md:w-[50%]">
            <p className="absolute top-5 mx-auto"><span className="text-2xl font-semibold text-[#3AA9AB]">CEC</span>connect</p>
            <h2 className="text-3xl text-[#3AA9AB] font-semibold">Create Account</h2>
            <form className="my-[2rem] flex space-y-4 flex-col items-center p-2">
              <div className="flex flex-col space-y-1">
                <label className="font-semibold">Username</label>
                <input type="text" name="username" placeholder="Enter your name" required className="border-1 p-2 border-gray-300 rounded-[.5rem] w-[20rem]" value={inputValue.name} onChange={handleChange}/> 
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-semibold">Password</label>
                <input type="password" name="password" placeholder="********" required className="border-1 p-2 border-gray-300 rounded-[.5rem] w-[20rem]" value={inputValue.password} onChange={handleChange}/> 
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-semibold">Confirm Password</label>
                <input type="password" name="password" placeholder="********" required className="border-1 p-2 border-gray-300 rounded-[.5rem] w-[20rem]" value={inputValue.confirmPassword} onChange={handleChange}/> 
              </div>
              <button className="p-2 bg-[#3AA9AB] text-white w-[10rem] rounded-[2rem] mt-[1rem] cursor-pointer">SIGN UP</button>
            </form>
            <p className="text-sm">Already have an account? <a href="#" className="text-blue-800">Login</a></p>
          </div>
          <div className="hidden w-[50%] bg-[#3AA9AB] md:block rounded-r-[1rem]">

          </div>
      </div>
  </div>
  )
};

export default Signup;
 