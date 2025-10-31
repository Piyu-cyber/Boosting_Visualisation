// components/DomainContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * DomainContext provides the currently selected dataset (domain) and the loaded data array.
 *
 * Usage (in pages/components):
 *   const { domain, setDomain, data } = useDomain();
 *
 * The data files are simple JSON arrays placed in the `data/` folder (e.g. `data/banking.json`).
 * Each object should contain numeric feature keys and a target key (boolean or numeric).
 */
export type DataPoint = Record<string, any>;

interface DomainContextType {
  domain: string;
  setDomain: (domain: string) => void;
  data: DataPoint[];
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const DomainProvider = ({ children }: { children: ReactNode }) => {
  // default domain is 'banking' (you can change this to 'automation' or your own dataset name)
  const [domain, setDomain] = useState<string>("banking");
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // dynamic import so Next.js can include JSON in the bundle and allow switching at runtime
        const response = await import(`../data/${domain}.json`);
        setData(response.default || []);
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