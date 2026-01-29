// types/auth.d.ts
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        LDAP_URI: string;
        LDAP_BASE_DN: string;
        LDAP_USER_OU: string;
        JWT_SECRET: string;
      }
    }
  }
  
  export interface User {
    username: string;
  }