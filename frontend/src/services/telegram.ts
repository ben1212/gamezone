/**
 * Telegram WebApp Integration Service
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          receiver?: TelegramUser;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        sendData: (data: string) => void;
      };
    };
  }
}

export class TelegramService {
  private static instance: TelegramService;
  public webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
  }

  public init(): void {
    if (this.webApp) {
      try {
        this.webApp.ready();
        this.webApp.expand();
        this.webApp.setHeaderColor('#0B1120');
        this.webApp.setBackgroundColor('#0B1120');
        this.webApp.enableClosingConfirmation();
      } catch (e) {
        console.warn('Telegram WebApp init warning:', e);
      }
    }
  }

  public getUser(): TelegramUser | null {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  public getInitData(): string {
    return this.webApp?.initData || '';
  }

  public getStartParam(): string | undefined {
    return this.webApp?.initDataUnsafe?.start_param;
  }

  public hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light'): void {
    try {
      this.webApp?.HapticFeedback?.impactOccurred(style);
    } catch {
      // Ignored if not in Telegram
    }
  }

  public hapticNotification(type: 'error' | 'success' | 'warning'): void {
    try {
      this.webApp?.HapticFeedback?.notificationOccurred(type);
    } catch {
      // Ignored if not in Telegram
    }
  }

  public close(): void {
    try {
      this.webApp?.close();
    } catch {
      // Ignored
    }
  }

  public openLink(url: string): void {
    if (this.webApp?.openLink) {
      this.webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  public openTelegramLink(url: string): void {
    if (this.webApp?.openTelegramLink) {
      this.webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }
}

export const tg = TelegramService.getInstance();
