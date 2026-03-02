import AuthService from "../services/authServices";
import type { Request,Response } from "express";
import type { AuthenticatedRequest } from '../utils/types';

class AuthController{
    static signup = async(req: Request, res: Response)=>{
      try{
        const {username,email,password} = req.body;
        if(!username || !email || !password)
          return res.status(400).json({message: 'please give required fields'});
        const existingUser = await AuthService.findUserByEmail(email);
        if(existingUser)return res.status(400).json({message: 'user has already registered'});
        const user = await AuthService.registerUser(username,email,password);
        return res.status(201).json(user);
      }catch(error){
        res.status(400).json({message: 'registration failed',error});
      }
    };
    static login = async(req: Request,res: Response)=> {
      try{
        console.log(req.body);
      const {email,password} = req.body;
      const token = await AuthService.loginUser(email,password);
      return res.status(200).json({token});
      }catch(error){
        console.log(error);
        res.status(400).json({message: 'login failed',error});
      }
    };

    static getUserById = async(req: AuthenticatedRequest,res: Response)=>{
      try{
        const user = req.user;
        const { id } = req.params;
        if (!id) 
        {
            return res.status(400).json({ message: "User ID is required" });
        }
        const foundUser = await AuthService.findUserById(parseInt(id));
        return res.json({foundUser: foundUser,user: user});
      }catch(error){
        res.status(500).json({ message: "Error fetching user", error });
      }
    };
    static StudentLogin = async(req: Request,res: Response)=> {
      try{
        console.log(req.body);
      const {email,password} = req.body;
      const token = await AuthService.loginStudent(email,password);
      return res.status(200).json({token});
      }catch(error: any){
        console.log(error);
        res.status(400).json({message: error.message || 'login failed',error});
      }
    };

    static getStudentById = async(req: AuthenticatedRequest,res: Response)=>{
      try{
        const user = req.user;
        const { id } = req.params;
        if (!id) 
        {
            return res.status(400).json({ message: "User ID is required" });
        }
        const foundUser = await AuthService.findStudentById(parseInt(id));
        return res.json({foundUser: foundUser,user: user});
      }catch(error){
        res.status(500).json({ message: "Error fetching user", error });
      }
    };
  }
  export default AuthController;