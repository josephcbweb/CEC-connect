export interface Hostel {
    id: number;
    name: string;
    wardenName: string;
    wardenPhone: string;
    monthlyRent: number;
    _count: {
        students: number;
    };
}

export interface Resident {
    id: number;
    name: string;
    phone: string;
    semester: number;
    className: string;
}
