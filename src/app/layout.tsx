import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Caméra 3D',description:'Composez une photo avec des éléments 3D.',robots:{index:false,follow:false}};
export const viewport: Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#181719'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="fr"><body>{children}</body></html>;}
