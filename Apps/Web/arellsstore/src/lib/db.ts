// lib/db.ts
export interface VatopGroup {
    cVatop: number;
    cpVatop: number;
    cVact: number;
    cVactTa: number;
    cdVatop: number;
  }
  
  export interface User {
    email: string;
    password: string;
    bitcoinAddress: string;
    bitcoinPrivateKey: string;
    vatopGroups: VatopGroup[];
  }
  
  // Simulate a database for storing users
  const users: User[] = [];
  
  export const findUserByEmail = (email: string): User | undefined => {
    return users.find(user => user.email === email);
  };
  
  export const saveUser = (user: User): void => {
    const index = users.findIndex(u => u.email === user.email);
    if (index === -1) {
      users.push(user);
    } else {
      users[index] = user;
    }
  };