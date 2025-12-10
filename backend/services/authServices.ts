import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

class AuthService{
  static registerUser = async (
    username: string,email: string,password: string
  )=>{
    const hashedpassword = await bcrypt.hash(password,10);
    const user = await prisma.user.create({
      data:{
        username,email,passwordHash: hashedpassword,
      },
    });
    return user;
  };
  static findUserById = async(id: number)=>{
    return prisma.user.findUnique({
      where: {id: id}
    });
  };
  static findUserByEmail = async(email: string)=>{
    return await prisma.user.findUnique({
      where: {email: email}
    });
  };

  static loginUser = async(email: string,password: string)=>{
    const user = await this.findUserByEmail(email);
    if(!user) throw new Error('User not found');
    console.log(password);
    const isMatch = await bcrypt.compare(password,user.passwordHash);
    if(!isMatch) throw new Error('Invalid Password');
    const token = jwt.sign({userId: user.id,username: user.username},JWT_SECRET!,{
      expiresIn: '30d',
    });
    return token;
  };
  static findStudentById = async(id: number)=>{
    return prisma.student.findUnique({
      where: {id: id}
    });
  };
  static findStudentByEmail = async(email: string)=>{
    return await prisma.student.findUnique({
      where: {email: email}
    });
  };
  static loginStudent = async(email: string,password: string)=>{
    const user = await this.findStudentByEmail(email);
    if(!user) throw new Error('User not found');
    console.log(password);
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) throw new Error('Invalid Password');
    const token = jwt.sign({userId: user.id,username: user.name},JWT_SECRET!,{
      expiresIn: '30d',
    });
    return token;
  };
}
export default AuthService;