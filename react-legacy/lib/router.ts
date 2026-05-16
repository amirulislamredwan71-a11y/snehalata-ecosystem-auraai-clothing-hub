import { createContext, useContext } from 'react';

export const RouterContext = createContext<{ path: string }>({ path: '/' });
export const ParamsContext = createContext<Record<string, string>>({});

export const useLocation = () => useContext(RouterContext);
export const useParams = <T extends Record<string, string>>() => useContext(ParamsContext) as T;
