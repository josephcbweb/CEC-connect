import AuthService from "../services/authServices";
import type { Request,Response } from "express";
import type { AuthenticatedRequest } from '../utils/types';
import jwt from "jsonwebtoken";
import { logAudit } from "../utils/auditLogger";

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
      const result = await AuthService.loginUser(email,password);

      // Log successful login
      await logAudit({
        req,
        action: "login",
        module: "auth",
        entityType: "Admin",
        entityId: result.user.id,
        userId: result.user.id,
        details: { status: "success", email }
      });

      return res.status(200).json({token: result});
      }catch(error: any){
        console.log(error);
        // Log failed login
        await logAudit({
          req,
          action: "login_failed",
          module: "auth",
          entityType: "Admin",
          userId: null, // explicit null to avoid undefined behavior or unwanted insertion
          details: { status: "failed", email: req.body?.email, error: error?.message }
        });
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
      
      const decoded = jwt.decode(token) as any;
      
      await logAudit({
        req,
        action: "login",
        module: "auth",
        entityType: "Student",
        entityId: decoded?.userId,
        userId: null,
        details: { status: "success", email }
      });

      return res.status(200).json({token});
      }catch(error: any){
        console.log(error);
        await logAudit({
          req,
          action: "login_failed",
          module: "auth",
          entityType: "Student",
          userId: null,
          details: { status: "failed", email: req.body?.email, error: error?.message }
        });
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

    static logout = async(req: AuthenticatedRequest, res: Response) => {
      try {
        const user = req.user as any;
        const isStudent = req.body?.type === 'student';
        
        await logAudit({
          req,
          action: "logout",
          module: "auth",
          entityType: isStudent ? "Student" : "Admin",
          entityId: user?.userId,
          userId: isStudent ? null : user?.userId,
          details: { status: "success", username: user?.username }
        });

        res.status(200).json({ message: "Logged out successfully" });
      } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Logout error" });
      }
    };
  }
  export default AuthController;