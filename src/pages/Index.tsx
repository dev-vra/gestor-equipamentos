import { useState } from "react";
import { HomeScreen } from "@/components/home/HomeScreen";
import { RetiradaScreen } from "@/components/retirada/RetiradaScreen";
import { DevolucaoScreen } from "@/components/devolucao/DevolucaoScreen";
import { CadastroScreen } from "@/components/cadastro/CadastroScreen";

type Screen = 'home' | 'retirada' | 'devolucao' | 'cadastro';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    setCurrentScreen('home');
  };

  switch (currentScreen) {
    case 'retirada':
      return <RetiradaScreen onBack={handleBack} />;
    case 'devolucao':
      return <DevolucaoScreen onBack={handleBack} />;
    case 'cadastro':
      return <CadastroScreen onBack={handleBack} />;
    default:
      return <HomeScreen onNavigate={handleNavigate} />;
  }
};

export default Index;
