import { Lead, User, UserRole, DashboardStats, AppSettings, FormConfig, DEFAULT_CONFIG, LeadStatus, LeadType, Meeting, EmailLog, SMTPConfig, SyncStatus } from '../types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ywutnptuhumqfyoaenvm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dXRucHR1aHVtcWZ5b2FlbnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDQxNzYsImV4cCI6MjA3OTY4MDE3Nn0.M5MMflPHWB6ty33CG3j5GK9KTCNqZu04p56ewYEhBNA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dXRucHR1aHVtcWZ5b2FlbnZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEwNDE3NiwiZXhwIjoyMDc5NjgwMTc2fQ.UBioFGdf7ldhuGPpnyM-jPQbE0fQXn35d5aS1dZYWww';

const USE_REAL_DB = !!(SUPABASE_URL && SUPABASE_KEY);
export const isSupabaseConnected = USE_REAL_DB;

const supabase = USE_REAL_DB ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const getAdminClient = () => {
  if (!SUPABASE_SERVICE_KEY) throw new Error("Service Key missing in backend.ts");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
};

const STORAGE_KEYS = {
  USERS: 'amwal_users_v1',
  LEADS: 'amwal_leads_v1',
  SESSION: 'amwal_session_v1',
  REAL_DB_SESSION: 'amwal_real_db_session_v1',
  SETTINGS: 'amwal_settings_v1',
  OFFLINE_QUEUE: 'amwal_offline_leads_v1',
  MEETINGS: 'amwal_meetings_v1',
  REMINDERS: 'amwal_reminders_v1',
  EMAIL_LOGS: 'amwal_email_logs_v1'
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const SEED_ADMIN: User = {
  id: 'admin-1',
  name: 'System Admin',
  email: 'admin@amwal.com',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date().toISOString(),
  password: 'admin123',
  permissions: { canEdit: true, canDelete: true }
};

const SEED_USER: User = {
  id: 'user-1',
  name: 'Sales Rep 1',
  email: 'user@amwal.com',
  role: UserRole.USER,
  isActive: true,
  createdAt: new Date().toISOString(),
  password: 'user123',
  permissions: { canEdit: false, canDelete: false }
};

const initializeMockDB = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([SEED_ADMIN, SEED_USER]));
  if (!localStorage.getItem(STORAGE_KEYS.LEADS)) localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.MEETINGS)) localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify([]));
};

if (!USE_REAL_DB) initializeMockDB();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getMockUsers = (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
const getMockLeads = (): Lead[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS) || '[]');
const saveMockUsers = (users: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
const saveMockLeads = (leads: Lead[]) => localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));

// --- EMAIL SERVICE ---
export const EmailService = {
    send: async (to: string, subject: string, body: string) => {
        const settings = await SettingsService.getSettings();
        const smtp = settings.smtpConfig || {};
        
        // Construct full email data
        const log: EmailLog = {
            id: generateId(),
            to,
            subject,
            body,
            sentAt: new Date().toISOString()
        };
        
        // In a real app, this would make an API call to a backend/edge function that uses Nodemailer
        // For this demo, we log what *would* happen based on config
        console.log(`
        ========================================
        📧 EMAIL NOTIFICATION SENT 
        ========================================
        SERVER CONFIG:
        Host: ${smtp.host || 'Not Configured'}
        Port: ${smtp.port || '25'}
        User: ${smtp.user || 'None'}
        Encryption: ${smtp.encryption || 'None'}
        
        FROM: ${smtp.fromName || 'System'} <${smtp.fromAddress || 'noreply@system.com'}>
        TO:   ${to}
        
        SUBJECT: ${subject}
        
        BODY:
        ${body}
        ========================================
        `);

        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS) || '[]');
        logs.push(log);
        localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(logs));
    },

    sendTest: async (smtp: SMTPConfig, to: string) => {
        await delay(1000); // Simulate network delay
        
        if (!smtp.host) throw new Error("SMTP Host is required.");
        if (!to) throw new Error("Recipient email is required.");

        console.log(`
        ========================================
        🧪 SMTP TEST EMAIL
        ========================================
        CONFIG:
        Host: ${smtp.host}
        Port: ${smtp.port}
        User: ${smtp.user}
        Secure: ${smtp.encryption}
        
        FROM: ${smtp.fromName} <${smtp.fromAddress}>
        TO: ${to}
        
        STATUS: SUCCESS (Simulated)
        ========================================
        `);
        return true;
    },

    getAdminEmail: async (): Promise<string> => {
        const users = await UserService.getAll();
        const admin = users.find(u => u.role === UserRole.ADMIN);
        return admin?.email || 'admin@amwal.com';
    }
};

export const AuthService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    if (USE_REAL_DB && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message || "Invalid login credentials.");
      if (!data.user) throw new Error('No user found');

      let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();

      if (!profile) {
         const newProfile = {
            id: data.user.id,
            email: data.user.email,
            name: email.split('@')[0], 
            role: 'USER', 
            is_active: true,
            permissions: { canEdit: false, canDelete: false }
         };
         const { data: insertedUser } = await supabase.from('profiles').upsert(newProfile).select().single();
         profile = insertedUser || newProfile;
      }

      if (email.toLowerCase() === 'admin@amwal.com' && profile?.role !== 'ADMIN') {
          const adminUpdates = { 
              id: data.user.id,
              email: data.user.email,
              name: 'System Admin',
              role: 'ADMIN',
              is_active: true,
              permissions: { canEdit: true, canDelete: true }
          };
          await supabase.from('profiles').upsert(adminUpdates);
          profile = { ...profile, ...adminUpdates };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || email.split('@')[0],
        role: (profile?.role as UserRole) || UserRole.USER,
        isActive: profile?.is_active ?? true,
        avatarUrl: profile?.avatar_url,
        createdAt: data.user.created_at || new Date().toISOString(),
        permissions: profile?.permissions || { canEdit: false, canDelete: false },
      };
      const token = data.session?.access_token || 'real-jwt';
      localStorage.setItem(STORAGE_KEYS.REAL_DB_SESSION, JSON.stringify(user));
      return { user, token };
    } else {
      await delay(500);
      const users = getMockUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password));
      if (!user) throw new Error('Invalid credentials');
      if (!user.isActive) throw new Error('Account is inactive.');
      const token = `fake-jwt-${user.id}-${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user, token }));
      return { user, token };
    }
  },

  logout: async () => {
    if (USE_REAL_DB && supabase) {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEYS.REAL_DB_SESSION); 
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    window.location.hash = '';
    window.location.reload(); 
  },

  getCurrentUser: (): User | null => {
    if (USE_REAL_DB) {
      const session = localStorage.getItem(STORAGE_KEYS.REAL_DB_SESSION);
      return session ? JSON.parse(session) : null;
    } else {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session).user : null;
    }
  }
};

export const UserService = {
  getAll: async (): Promise<User[]> => {
    if (USE_REAL_DB && supabase) {
       const client = SUPABASE_SERVICE_KEY ? getAdminClient() : supabase;
       const { data, error } = await client.from('profiles').select('*');
       if(error) throw new Error(error.message);
       return data.map((p: any) => ({
         id: p.id,
         name: p.name,
         email: p.email,
         role: p.role,
         isActive: p.is_active,
         avatarUrl: p.avatar_url,
         createdAt: p.created_at,
         permissions: p.permissions || { canEdit: false, canDelete: false }
       }));
    } else {
      await delay(300);
      return getMockUsers();
    }
  },

  getById: async (id: string): Promise<User | undefined> => {
      const users = await UserService.getAll();
      return users.find(u => u.id === id);
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    if (USE_REAL_DB && supabase) {
      if (!SUPABASE_SERVICE_KEY) throw new Error("Service Key missing.");
      const adminClient = getAdminClient();
      const { data, error } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password!,
        email_confirm: true,
        user_metadata: { name: userData.name }
      });
      if (error) throw new Error(error.message);
      const newUserId = data.user.id;
      const profileUpdates = {
         id: newUserId,
         email: userData.email,
         name: userData.name,
         role: userData.role,
         is_active: userData.isActive,
         permissions: userData.permissions,
         created_at: new Date().toISOString()
      };
      await adminClient.from('profiles').upsert(profileUpdates);
      return { ...userData, id: newUserId, createdAt: new Date().toISOString() } as User;
    } else {
      await delay(300);
      const users = getMockUsers();
      if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) throw new Error('Email already exists');
      const newUser: User = {
        ...userData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        permissions: userData.permissions || { canEdit: false, canDelete: false }
      };
      users.push(newUser);
      saveMockUsers(users);
      return newUser;
    }
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    if (USE_REAL_DB && supabase) {
       const client = SUPABASE_SERVICE_KEY ? getAdminClient() : supabase;
       const payload: any = {
         name: updates.name,
         role: updates.role,
         is_active: updates.isActive,
         permissions: updates.permissions
       };
       if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;
       if (updates.password) {
           if (id === (await supabase.auth.getUser()).data.user?.id) await supabase.auth.updateUser({ password: updates.password });
           else if (SUPABASE_SERVICE_KEY) await client.auth.admin.updateUserById(id, { password: updates.password });
       }
       const { error } = await client.from('profiles').update(payload).eq('id', id);
       if (error) throw new Error(error.message);
       return { id, ...updates } as User;
    } else {
      await delay(300);
      const users = getMockUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User not found');
      users[idx] = { ...users[idx], ...updates };
      saveMockUsers(users);
      return users[idx];
    }
  },

  delete: async (id: string): Promise<void> => {
    if (id === 'admin-1') throw new Error('Cannot delete system admin');
    if (USE_REAL_DB && supabase) {
       const client = SUPABASE_SERVICE_KEY ? getAdminClient() : supabase;
       await client.auth.admin.deleteUser(id);
    } else {
      await delay(300);
      let users = getMockUsers();
      users = users.filter(u => u.id !== id);
      saveMockUsers(users);
    }
  }
};

export const SettingsService = {
    getSettings: async (): Promise<AppSettings> => {
        const defaultSettings = { 
            id: 'config', 
            appName: 'Amwal Survey', 
            appIconUrl: 'https://amwalpay.om/wp-content/uploads/2023/11/WhatsApp-Image-2025-04-20-at-12.04.42.jpeg',
            config: DEFAULT_CONFIG,
            smtpConfig: {}
        };

        if (USE_REAL_DB && supabase) {
            try {
                const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'config').maybeSingle();
                if (error && error.code !== '42P01' && !error.message.includes('does not exist')) {
                    console.error("Settings fetch error:", JSON.stringify(error, null, 2));
                }
                if (!data) return defaultSettings;
                return {
                    id: 'config',
                    appName: data.app_name,
                    appIconUrl: data.app_icon_url,
                    config: data.config || DEFAULT_CONFIG,
                    smtpConfig: data.smtp_config || {}
                };
            } catch (e) {
                return defaultSettings;
            }
        } else {
            const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return stored ? JSON.parse(stored) : defaultSettings;
        }
    },

    updateSettings: async (settings: AppSettings): Promise<void> => {
        if (USE_REAL_DB && supabase) {
            const payload = {
                id: 'config',
                app_name: settings.appName,
                app_icon_url: settings.appIconUrl,
                config: settings.config,
                smtp_config: settings.smtpConfig,
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from('app_settings').upsert(payload);
            if (error) throw new Error(error.message);
        } else {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        }
    }
};

export const LeadService = {
  getAll: async (user: User): Promise<Lead[]> => {
    let serverLeads: Lead[] = [];
    if (USE_REAL_DB && supabase) {
      let query = supabase.from('leads').select('*');
      // ADMIN sees all leads, User only sees their own
      if (user.role !== UserRole.ADMIN) query = query.eq('user_id', user.id);
      const { data: leads, error } = await query;
      if (!error && leads) {
          const userIds = [...new Set(leads.map((l: any) => l.user_id))];
          let userMap: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
            profiles?.forEach((p: any) => userMap[p.id] = p.name);
          }
          serverLeads = leads.map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            userName: userMap[l.user_id] || 'Unknown',
            ownerName: l.full_name,
            mainPoc: l.main_poc,
            mobile: l.mobile,
            email: l.email,
            latitude: l.latitude,
            longitude: l.longitude,
            crNumber: l.cr_number,
            crFileName: l.cr_file_name,
            crFileData: l.cr_file_data, 
            industry: l.industry,
            subIndustry: l.sub_industry,
            platform: l.platform,
            acquirer: l.acquirer,
            gmv: l.gmv,
            leadSource: l.lead_source,
            leadType: l.lead_type,
            serviceNeeded: l.service_needed,
            remarks: l.remarks,
            remarksLocked: l.remarks_locked,
            adminComments: l.admin_comments,
            socialLinks: l.social_links || [],
            status: l.status,
            assignedTo: l.assigned_to,
            isFavorite: l.is_favorite,
            interactionLog: l.interaction_log || [],
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            syncStatus: 'synced'
          }));
      }
    } else {
      await delay(300);
      const allLeads = getMockLeads();
      serverLeads = (user.role === UserRole.ADMIN) ? allLeads : allLeads.filter(l => l.userId === user.id);
    }

    const queueStr = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (queueStr) {
        const queue: Lead[] = JSON.parse(queueStr);
        const myOfflineLeads = queue.filter(l => l.userId === user.id);
        const combined = [...myOfflineLeads, ...serverLeads];
        // Deduplicate, preferring offline version if exists
        const leadMap = new Map<string, Lead>();
        for (const lead of combined) {
            if (!leadMap.has(lead.id)) {
                leadMap.set(lead.id, lead);
            }
        }
        return Array.from(leadMap.values());
    }
    return serverLeads;
  },

  getDashboardStats: async (user: User): Promise<DashboardStats> => {
     const leads = await LeadService.getAll(user);
     const meetings = await MeetingService.getAll(user);
     
     const totalLeads = leads.length;
     const now = new Date();
     const newThisMonth = leads.filter(l => {
         const d = new Date(l.createdAt);
         return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
     }).length;
     const newToday = leads.filter(l => {
         const d = new Date(l.createdAt);
         return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
     }).length;

     const industryMap: Record<string, number> = {};
     leads.forEach(l => { const ind = l.industry || 'Other'; industryMap[ind] = (industryMap[ind] || 0) + 1; });
     const leadsByIndustry = Object.entries(industryMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
     
     const serviceMap: Record<string, number> = {};
     leads.forEach(l => { const ser = l.serviceNeeded || 'Other'; serviceMap[ser] = (serviceMap[ser] || 0) + 1; });
     const leadsByService = Object.entries(serviceMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

     const upcomingMeetings = meetings
        .filter(m => new Date(`${m.date}T${m.time}`) >= now)
        .sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
        .slice(0, 3);

     // PENDING TASKS LOGIC
     // User: Leads assigned to them that are PENDING
     // Admin: Leads assigned to them (PENDING) OR any lead in PROCESSING state (needing admin review)
     let pendingTasks: Lead[] = [];
     if (user.role === UserRole.ADMIN) {
         // Ideally, getAll() should return all leads for admin, so we filter in memory
         const allLeads = await LeadService.getAll(user); 
         pendingTasks = allLeads.filter(l => 
             (l.assignedTo === user.id && l.status === LeadStatus.PENDING) || 
             l.status === LeadStatus.PROCESSING
         );
     } else {
         pendingTasks = leads.filter(l => l.assignedTo === user.id && l.status === LeadStatus.PENDING);
     }
     
     // Sort by date descending (newest first) and slice
     pendingTasks = pendingTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

     const favoriteLeads = leads.filter(l => l.isFavorite).slice(0, 5);

     return { totalLeads, newToday, newThisMonth, leadsByIndustry, leadsByService, leadsByStatus: [], upcomingMeetings, pendingTasks, favoriteLeads };
  },

  create: async (leadData: any, currentUser: User): Promise<Lead> => {
    // Offline Handling
    if (!navigator.onLine) {
       const offlineLead = {
           ...leadData,
           id: generateId(),
           userId: currentUser.id,
           userName: currentUser.name,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           remarksLocked: !!leadData.remarks,
           status: LeadStatus.PENDING,
           interactionLog: [],
           syncStatus: 'pending' as SyncStatus
       };
       const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
       queue.push(offlineLead);
       localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
       return offlineLead;
    }

    let createdLead: Lead;

    if (USE_REAL_DB && supabase) {
      const payload = {
        user_id: currentUser.id,
        full_name: leadData.ownerName,
        main_poc: leadData.mainPoc,
        mobile: leadData.mobile,
        email: leadData.email,
        cr_number: leadData.crNumber,
        cr_file_name: leadData.crFileName,
        cr_file_data: leadData.crFileData,
        industry: leadData.industry,
        sub_industry: leadData.subIndustry,
        lead_source: leadData.leadSource,
        platform: leadData.platform,
        acquirer: leadData.acquirer,
        gmv: leadData.gmv,
        service_needed: leadData.serviceNeeded,
        social_links: leadData.socialLinks,
        remarks: leadData.remarks,
        remarks_locked: !!leadData.remarks,
        lead_type: leadData.leadType,
        status: LeadStatus.PENDING,
        assigned_to: currentUser.id, 
        is_favorite: false,
        interaction_log: []
      };

      const { data, error } = await supabase.from('leads').insert(payload).select().single();
      if (error) throw new Error(error.message);
      createdLead = { ...data, id: data.id, syncStatus: 'synced' } as any;
    } else {
      await delay(400);
      const leads = getMockLeads();
      const newLead = { 
          ...leadData, 
          id: generateId(), 
          userId: currentUser.id, 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          status: LeadStatus.PENDING,
          syncStatus: 'synced' as SyncStatus
      };
      leads.push(newLead);
      saveMockLeads(leads);
      createdLead = newLead;
    }

    // TRIGGER NOTIFICATION: Lead Created
    // Send email to Admin
    const adminEmail = await EmailService.getAdminEmail();
    EmailService.send(
        adminEmail, 
        "New Lead Created", 
        `A new lead has been created.\n\nCreator: ${currentUser.name}\nLead Name: ${createdLead.ownerName}\nIndustry: ${createdLead.industry}\nDate: ${new Date().toLocaleString()}`
    );

    return createdLead;
  },

  update: async (id: string, updates: any, currentUser: User): Promise<Lead> => {
    // Fetch previous state to check for triggers
    let previousLead: Lead | undefined;
    if (USE_REAL_DB && supabase) {
       const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
       if (!error && data) {
           // partial map just to get necessary fields
           previousLead = { ...data, userId: data.user_id, assignedTo: data.assigned_to, ownerName: data.full_name, interactionLog: data.interaction_log || [] } as unknown as Lead;
       }
    } else {
       const leads = getMockLeads();
       previousLead = leads.find(l => l.id === id);
    }

    if (!previousLead) throw new Error("Lead not found");

    // Permission Check
    const isOwner = previousLead.userId === currentUser.id;
    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isAdmin && (!isOwner || !currentUser.permissions?.canEdit)) {
        throw new Error('You do not have permission to edit this lead.');
    }

    // --- AUTO STATUS UPDATE LOGIC ---
    // If a non-admin user adds a new log/activity, automatically change status to PROCESSING
    // so it appears in Admin's "My Tasks" queue.
    if (!isAdmin && updates.interactionLog) {
        const oldLogLength = previousLead.interactionLog?.length || 0;
        const newLogLength = updates.interactionLog.length;
        if (newLogLength > oldLogLength) {
            // User added activity -> Move to PROCESSING
            if (previousLead.status === LeadStatus.PENDING || previousLead.status === LeadStatus.PROCESSING) {
                updates.status = LeadStatus.PROCESSING;
            }
        }
    }

    let updatedLead: Lead;

    if (USE_REAL_DB && supabase) {
       const payload: any = { updated_at: new Date().toISOString() };
       if (updates.ownerName !== undefined) payload.full_name = updates.ownerName;
       if (updates.mainPoc !== undefined) payload.main_poc = updates.mainPoc;
       if (updates.industry !== undefined) payload.industry = updates.industry;
       if (updates.subIndustry !== undefined) payload.sub_industry = updates.subIndustry;
       if (updates.leadSource !== undefined) payload.lead_source = updates.leadSource;
       if (updates.platform !== undefined) payload.platform = updates.platform;
       if (updates.acquirer !== undefined) payload.acquirer = updates.acquirer;
       if (updates.gmv !== undefined) payload.gmv = updates.gmv;
       if (updates.leadType !== undefined) payload.lead_type = updates.leadType;
       if (updates.status !== undefined) payload.status = updates.status;
       if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
       if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
       if (updates.interactionLog !== undefined) payload.interaction_log = updates.interactionLog;
       if (updates.crFileName !== undefined) payload.cr_file_name = updates.crFileName;
       if (updates.crFileData !== undefined) payload.cr_file_data = updates.crFileData;
       if (updates.remarks !== undefined) payload.remarks = updates.remarks;
       
       const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single();
       if (error) throw new Error(error.message);
       updatedLead = { ...data, syncStatus: 'synced' } as any;
    } else {
      await delay(300);
      const leads = getMockLeads();
      const idx = leads.findIndex(l => l.id === id);
      const updated = { ...leads[idx], ...updates, updatedAt: new Date().toISOString(), syncStatus: 'synced' };
      leads[idx] = updated;
      saveMockLeads(leads);
      updatedLead = updated as any;
    }

    // --- TRIGGER NOTIFICATIONS ---

    // 1. Assignment Change
    if (updates.assignedTo && updates.assignedTo !== previousLead.assignedTo) {
        const assignee = await UserService.getById(updates.assignedTo);
        if (assignee) {
            EmailService.send(
                assignee.email,
                "Lead Assigned to You",
                `You have been assigned a new lead by ${currentUser.name}.\n\nLead: ${previousLead.ownerName}\nLink: Open App to view.`
            );
        }
    }

    // 2. New Activity/Log added by ADMIN for USER's lead
    if (isAdmin && previousLead.userId !== currentUser.id) {
        // Check if interaction log grew
        const oldLogLength = previousLead.interactionLog?.length || 0;
        const newLogLength = updates.interactionLog?.length || 0;
        
        if (newLogLength > oldLogLength) {
             const owner = await UserService.getById(previousLead.userId);
             if (owner) {
                 EmailService.send(
                     owner.email,
                     "New Activity on Your Lead",
                     `Admin ${currentUser.name} added a note/activity to your lead "${previousLead.ownerName}".\n\nCheck the app for details.`
                 );
             }
        } 
        // 3. General Update by Admin on User's Lead
        else if (Object.keys(updates).some(k => k !== 'updatedAt' && k !== 'syncStatus')) {
             const owner = await UserService.getById(previousLead.userId);
             if (owner) {
                 EmailService.send(
                     owner.email,
                     "Lead Updated by Admin",
                     `Your lead "${previousLead.ownerName}" was updated by System Admin.`
                 );
             }
        }
    }
    
    // 4. Lead moved to PROCESSING (User activity) -> Notify Admin if not already notified
    if (!isAdmin && updates.status === LeadStatus.PROCESSING && previousLead.status !== LeadStatus.PROCESSING) {
        const adminEmail = await EmailService.getAdminEmail();
        EmailService.send(
            adminEmail,
            "Lead Action Required (Processing)",
            `User ${currentUser.name} has added activity to lead "${previousLead.ownerName}".\nStatus is now PROCESSING.\n\nPlease review in My Tasks.`
        );
    }

    return updatedLead;
  },

  delete: async (id: string, currentUser: User): Promise<void> => {
    if (USE_REAL_DB && supabase) {
      const { data: leadToDelete, error: fetchError } = await supabase.from('leads').select('user_id').eq('id', id).single();
      if (fetchError || !leadToDelete) throw new Error('Lead not found.');

      const isOwner = leadToDelete.user_id === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;
      if (!isAdmin && (!isOwner || !currentUser.permissions?.canDelete)) {
          throw new Error('You do not have permission to delete this lead.');
      }

      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      await delay(300);
      let leads = getMockLeads();
      const idx = leads.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Lead not found');

      const leadToDelete = leads[idx];
      const isOwner = leadToDelete.userId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;
      if (!isAdmin && (!isOwner || !currentUser.permissions?.canDelete)) {
          throw new Error('You do not have permission to delete this lead.');
      }

      leads = leads.filter(l => l.id !== id);
      saveMockLeads(leads);
    }
  },
};

export const SyncService = {
    getQueue: (): Lead[] => {
        const queueStr = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
        return queueStr ? JSON.parse(queueStr) : [];
    },

    getStatus: (): { status: SyncStatus, count: number } => {
        const queue = SyncService.getQueue();
        if (queue.length === 0) {
            return { status: 'synced', count: 0 };
        }
        if (queue.some(l => l.syncStatus === 'failed')) {
            return { status: 'failed', count: queue.filter(l => l.syncStatus === 'failed').length };
        }
        return { status: 'pending', count: queue.length };
    },

    processOfflineQueue: async (): Promise<{synced: number, failed: number}> => {
        if (!navigator.onLine) return { synced: 0, failed: 0 };
        const queue = SyncService.getQueue();
        if (queue.length === 0) return { synced: 0, failed: 0 };
        
        let syncedCount = 0;
        const failedQueue: Lead[] = [];

        for (const lead of queue) {
            try {
                if (USE_REAL_DB && supabase) {
                   const { id, syncStatus, ...payloadToSync } = lead;
                   const payload = {
                       user_id: payloadToSync.userId,
                       full_name: payloadToSync.ownerName,
                       mobile: payloadToSync.mobile,
                       email: payloadToSync.email,
                       cr_number: payloadToSync.crNumber,
                       cr_file_name: payloadToSync.crFileName,
                       cr_file_data: payloadToSync.crFileData,
                       industry: payloadToSync.industry,
                       sub_industry: payloadToSync.subIndustry,
                       lead_source: payloadToSync.leadSource,
                       platform: payloadToSync.platform,
                       acquirer: payloadToSync.acquirer,
                       gmv: payloadToSync.gmv,
                       service_needed: payloadToSync.serviceNeeded,
                       remarks: payloadToSync.remarks,
                       social_links: payloadToSync.socialLinks,
                       lead_type: payloadToSync.leadType,
                       status: payloadToSync.status,
                       created_at: payloadToSync.createdAt
                   };
                   const { error } = await supabase.from('leads').insert(payload);
                   if (error) throw error;
                } else {
                    const leads = getMockLeads();
                    leads.push({...lead, syncStatus: 'synced'});
                    saveMockLeads(leads);
                }
                syncedCount++;
            } catch (e) {
                console.error("Sync failed for lead:", lead.id, e);
                failedQueue.push({ ...lead, syncStatus: 'failed' });
            }
        }
        
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(failedQueue));
        return { synced: syncedCount, failed: failedQueue.length };
    }
};

export const MeetingService = {
    getAll: async (user: User): Promise<Meeting[]> => {
        if (USE_REAL_DB && supabase) {
            let query = supabase.from('meetings').select('*');
            if (user.role !== UserRole.ADMIN) query = query.eq('user_id', user.id);
            const { data, error } = await query;
            if (error) {
                if (error.code === '42P01') return []; // Table missing, return empty
                throw new Error(error.message);
            }
            return data.map((m: any) => ({
                id: m.id,
                userId: m.user_id,
                title: m.title,
                date: m.date,
                time: m.time,
                description: m.description,
                imageData: m.image_data,
                reminder: m.reminder,
                createdAt: m.created_at
            }));
        } else {
            await delay(300);
            const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
            if (user.role === UserRole.ADMIN) return all;
            return all.filter((m: Meeting) => m.userId === user.id);
        }
    },

    create: async (data: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> => {
        if (USE_REAL_DB && supabase) {
            const payload = {
                user_id: data.userId,
                title: data.title,
                date: data.date,
                time: data.time,
                description: data.description,
                image_data: data.imageData,
                reminder: data.reminder
            };
            const { data: newM, error } = await supabase.from('meetings').insert(payload).select().single();
            if (error) throw new Error(error.message);
            return {
                id: newM.id,
                userId: newM.user_id,
                title: newM.title,
                date: newM.date,
                time: newM.time,
                description: newM.description,
                imageData: newM.image_data,
                reminder: newM.reminder,
                createdAt: newM.created_at
            };
        } else {
            await delay(300);
            const meetings = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
            const newM: Meeting = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            meetings.push(newM);
            localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
            return newM;
        }
    },

    delete: async (id: string): Promise<void> => {
        if (USE_REAL_DB && supabase) {
            const { error } = await supabase.from('meetings').delete().eq('id', id);
            if (error) throw new Error(error.message);
        } else {
            await delay(300);
            let meetings = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
            meetings = meetings.filter((m: Meeting) => m.id !== id);
            localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
        }
    }
};