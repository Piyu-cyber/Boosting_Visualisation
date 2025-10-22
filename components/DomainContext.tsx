// components/DomainContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DataPoint {
  age: number;
  balance: number;
  duration: number;
  subscribed: number;
}

interface DomainContextType {
  domain: string;
  setDomain: (domain: string) => void;
  data: DataPoint[];
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const DomainProvider = ({ children }: { children: ReactNode }) => {
  const [domain, setDomain] = useState<string>("banking");
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await import(`../data/${domain}.json`);
        setData(response.default);
      } catch (error) {
        console.error("Error loading data:", error);
        setData([]);
      }
    };
    loadData();
  }, [domain]);

  return (
    <DomainContext.Provider value={{ domain, setDomain, data }}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error("useDomain must be used within a DomainProvider");
  }
  return context;
};