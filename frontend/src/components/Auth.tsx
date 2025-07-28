import React from "react";
import {useState} from "react";


const Auth = () => {
  
  return (
    <div className="h-screen w-screen flex items-center justify-center p-[4px]">
      <div className="flex w-[25rem] h-[40rem] m-auto md:w-[55rem] shadow-xl rounded-[1rem]">
          <div className="flex flex-col items-center justify-center p-5 w-full h-full border-r-[2px] md:w-[45%]">
            <p className="place-content-start">CEConnect</p>
            <h2 className="text-3xl">Create Account</h2>
            <form >
              {/* <input type="text" name="username" required placeholder="Username" className="border-[2px] p-2 rounded-[1rem]" /> */}
            </form>
          </div>
          <div className="hidden w-[50%]">

          </div>
      </div>
  </div>
  )
    
  
  
};

export default Auth;
 