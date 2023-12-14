import React, { ReactNode, createContext, useContext } from 'react';
import { useAccount } from 'wagmi';
import { cssStringFromTheme } from '../../css/cssStringFromTheme';
import { ThemeVars } from '../../css/sprinkles.css';
import { Locale } from '../../locales';
import { lightTheme } from '../../themes/lightTheme';
import { TransactionStoreProvider } from '../../transactions/TransactionStoreContext';
import { AppContext, DisclaimerComponent, defaultAppInfo } from './AppContext';
import { AvatarComponent, AvatarContext, defaultAvatar } from './AvatarContext';
import { CoolModeContext } from './CoolModeContext';
import { I18nProvider } from './I18nContext';
import { ModalProvider } from './ModalContext';
import {
  ModalSizeOptions,
  ModalSizeProvider,
  ModalSizes,
} from './ModalSizeContext';
import {
  RainbowKitChain,
  RainbowKitChainProvider,
} from './RainbowKitChainContext';
import { ShowRecentTransactionsContext } from './ShowRecentTransactionsContext';
import { WalletButtonProvider } from './WalletButtonContext';
import { useFingerprint } from './useFingerprint';
import { usePreloadImages } from './usePreloadImages';
import { clearWalletConnectDeepLink } from './walletConnectDeepLink';

const ThemeIdContext = createContext<string | undefined>(undefined);

const attr = 'data-rk';

const createThemeRootProps = (id: string | undefined) => ({ [attr]: id || '' });

const createThemeRootSelector = (id: string | undefined) => {
  if (id && !/^[a-zA-Z0-9_]+$/.test(id)) {
    throw new Error(`Invalid ID: ${id}`);
  }

  return id ? `[${attr}="${id}"]` : `[${attr}]`;
};

export const useThemeRootProps = () => {
  const id = useContext(ThemeIdContext);
  return createThemeRootProps(id);
};

export type Theme =
  | ThemeVars
  | {
      lightMode: ThemeVars;
      darkMode: ThemeVars;
    };

export interface RainbowKitProviderProps {
  chains: RainbowKitChain[];
  disabledChains?: RainbowKitChain[];
  onDisabledChainClick?: (chain: RainbowKitChain) => void;
  initialChain?: RainbowKitChain | number;
  id?: string;
  children: ReactNode;
  theme?: Theme | null;
  showRecentTransactions?: boolean;
  appInfo?: {
    appName?: string;
    learnMoreUrl?: string;
    disclaimer?: DisclaimerComponent;
  };
  coolMode?: boolean;
  avatar?: AvatarComponent;
  modalSize?: ModalSizes;
  locale?: Locale;
}

const defaultTheme = lightTheme();

export function RainbowKitProvider({
  appInfo,
  avatar,
  chains,
  disabledChains,
  onDisabledChainClick,
  children,
  coolMode = false,
  id,
  initialChain,
  locale,
  modalSize = ModalSizeOptions.WIDE,
  showRecentTransactions = false,
  theme = defaultTheme,
}: RainbowKitProviderProps) {
  usePreloadImages();
  useFingerprint();

  useAccount({ onDisconnect: clearWalletConnectDeepLink });

  if (typeof theme === 'function') {
    throw new Error(
      'A theme function was provided to the "theme" prop instead of a theme object. You must execute this function to get the resulting theme object.',
    );
  }

  const selector = createThemeRootSelector(id);

  const appContext = {
    ...defaultAppInfo,
    ...appInfo,
  };

  const avatarContext = avatar ?? defaultAvatar;

  return (
    <RainbowKitChainProvider
      chains={chains}
      disabledChains={disabledChains}
      initialChain={initialChain}
      onDisabledChainClick={onDisabledChainClick}
    >
      <WalletButtonProvider>
        <I18nProvider locale={locale}>
          <CoolModeContext.Provider value={coolMode}>
            <ModalSizeProvider modalSize={modalSize}>
              <ShowRecentTransactionsContext.Provider
                value={showRecentTransactions}
              >
                <TransactionStoreProvider>
                  <AvatarContext.Provider value={avatarContext}>
                    <AppContext.Provider value={appContext}>
                      <ThemeIdContext.Provider value={id}>
                        <ModalProvider>
                          {theme ? (
                            <div {...createThemeRootProps(id)}>
                              <style
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: TODO
                                dangerouslySetInnerHTML={{
                                  // Selectors are sanitized to only contain alphanumeric
                                  // and underscore characters. Theme values generated by
                                  // cssStringFromTheme are sanitized, removing
                                  // characters that terminate values / HTML tags.
                                  __html: [
                                    `${selector}{${cssStringFromTheme(
                                      'lightMode' in theme
                                        ? theme.lightMode
                                        : theme,
                                    )}}`,

                                    'darkMode' in theme
                                      ? `@media(prefers-color-scheme:dark){${selector}{${cssStringFromTheme(
                                          theme.darkMode,
                                          { extends: theme.lightMode },
                                        )}}}`
                                      : null,
                                  ].join(''),
                                }}
                              />
                              {children}
                            </div>
                          ) : (
                            children
                          )}
                        </ModalProvider>
                      </ThemeIdContext.Provider>
                    </AppContext.Provider>
                  </AvatarContext.Provider>
                </TransactionStoreProvider>
              </ShowRecentTransactionsContext.Provider>
            </ModalSizeProvider>
          </CoolModeContext.Provider>
        </I18nProvider>
      </WalletButtonProvider>
    </RainbowKitChainProvider>
  );
}
