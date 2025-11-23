import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'god' | 'secret' | 'limited' | 'admin';

interface NFT {
  id: string;
  name: string;
  rarity: Rarity;
  cps: number;
  image: string;
  mutated?: boolean;
}

interface User {
  username: string;
  isAdmin: boolean;
}

const rarityConfig: Record<Rarity, { name: string; color: string; chance: number; cpsRange: [number, number] }> = {
  common: { name: 'Обычный', color: '#8E9196', chance: 40, cpsRange: [1, 5] },
  uncommon: { name: 'Необычный', color: '#0EA5E9', chance: 25, cpsRange: [5, 15] },
  rare: { name: 'Редкий', color: '#9b87f5', chance: 15, cpsRange: [15, 30] },
  epic: { name: 'Епический', color: '#D946EF', chance: 10, cpsRange: [30, 60] },
  legendary: { name: 'Легендарный', color: '#F97316', chance: 6, cpsRange: [60, 100] },
  god: { name: 'Бог', color: '#FEF7CD', chance: 2.5, cpsRange: [100, 200] },
  secret: { name: 'Секретный', color: '#F2FCE2', chance: 1, cpsRange: [200, 350] },
  limited: { name: 'Лимитированый', color: '#FFDEE2', chance: 0.4, cpsRange: [350, 500] },
  admin: { name: 'Админский', color: '#FFFFFF', chance: 0.1, cpsRange: [500, 1000] },
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [clicks, setClicks] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [inventory, setInventory] = useState<NFT[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [clickWarnings, setClickWarnings] = useState(0);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const casePrice = 100;
  const upgradePrice = 50;
  const mutationPrice = 500;

  const totalCPS = inventory.reduce((sum, nft) => sum + nft.cps, 0);

  useEffect(() => {
    if (totalCPS === 0) return;
    const interval = setInterval(() => {
      setClicks(prev => prev + totalCPS);
    }, 1000);
    return () => clearInterval(interval);
  }, [totalCPS]);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff < 10 && lastClickTime !== 0) {
      const newWarnings = clickWarnings + 1;
      setClickWarnings(newWarnings);

      if (newWarnings === 1) {
        toast({
          title: "⚠️ Предупреждение 1",
          description: "Обнаружены слишком быстрые клики!",
          variant: "destructive",
        });
      } else if (newWarnings === 2) {
        toast({
          title: "⚠️ Предупреждение 2",
          description: "Снято 50% кликов за использование автокликера!",
          variant: "destructive",
        });
        setClicks(prev => Math.floor(prev / 2));
      } else if (newWarnings >= 3) {
        toast({
          title: "🚫 ЗАБАНЕН",
          description: "Аккаунт заблокирован за читерство без возможности восстановления!",
          variant: "destructive",
        });
        return;
      }
    }

    setLastClickTime(now);
    setClicks(prev => prev + clickPower);
  }, [clickPower, lastClickTime, clickWarnings]);

  const getRarity = (): Rarity => {
    const roll = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, config] of Object.entries(rarityConfig)) {
      cumulative += config.chance;
      if (roll <= cumulative) {
        return rarity as Rarity;
      }
    }
    return 'common';
  };

  const openCase = () => {
    if (clicks < casePrice) {
      toast({
        title: "Недостаточно кликов",
        description: `Нужно ${casePrice} кликов`,
        variant: "destructive",
      });
      return;
    }

    setIsOpening(true);
    setClicks(prev => prev - casePrice);

    setTimeout(() => {
      const rarity = getRarity();
      const config = rarityConfig[rarity];
      const cps = Math.floor(Math.random() * (config.cpsRange[1] - config.cpsRange[0] + 1)) + config.cpsRange[0];
      
      const newNFT: NFT = {
        id: Date.now().toString(),
        name: `${config.name} NFT #${Math.floor(Math.random() * 9999)}`,
        rarity,
        cps,
        image: '🎴',
      };

      setInventory(prev => [...prev, newNFT]);
      setIsOpening(false);

      toast({
        title: `✨ Получен ${config.name}!`,
        description: `${newNFT.name} (+${cps} CPS)`,
        style: { borderColor: config.color, borderWidth: '2px' },
      });
    }, 2000);
  };

  const upgradeClick = () => {
    if (clicks < upgradePrice) {
      toast({
        title: "Недостаточно кликов",
        description: `Нужно ${upgradePrice} кликов`,
        variant: "destructive",
      });
      return;
    }

    setClicks(prev => prev - upgradePrice);
    setClickPower(prev => prev + 1);
    toast({
      title: "Улучшение куплено!",
      description: `Сила клика: ${clickPower + 1}`,
    });
  };

  const mutateNFT = () => {
    if (!selectedNFT) return;
    if (selectedNFT.mutated) {
      toast({
        title: "Уже мутирован!",
        description: "Этот NFT уже был мутирован",
        variant: "destructive",
      });
      return;
    }
    if (clicks < mutationPrice) {
      toast({
        title: "Недостаточно кликов",
        description: `Нужно ${mutationPrice} кликов`,
        variant: "destructive",
      });
      return;
    }

    setIsMutating(true);
    setClicks(prev => prev - mutationPrice);

    setTimeout(() => {
      const rarities = Object.keys(rarityConfig) as Rarity[];
      const currentIndex = rarities.indexOf(selectedNFT.rarity);
      const canUpgrade = currentIndex < rarities.length - 1;
      const success = Math.random() < 0.5;

      if (success && canUpgrade) {
        const newRarity = rarities[currentIndex + 1];
        const config = rarityConfig[newRarity];
        const newCPS = Math.floor(Math.random() * (config.cpsRange[1] - config.cpsRange[0] + 1)) + config.cpsRange[0];
        
        setInventory(prev => prev.map(nft => 
          nft.id === selectedNFT.id 
            ? { ...nft, rarity: newRarity, cps: newCPS, mutated: true, name: `${config.name} NFT #${Math.floor(Math.random() * 9999)}` }
            : nft
        ));
        
        toast({
          title: "✨ Успешная мутация!",
          description: `Получена редкость: ${config.name} (+${newCPS} CPS)`,
          style: { borderColor: config.color, borderWidth: '2px' },
        });
      } else {
        setInventory(prev => prev.map(nft => 
          nft.id === selectedNFT.id ? { ...nft, mutated: true } : nft
        ));
        toast({
          title: "💥 Мутация не удалась",
          description: "NFT остался прежним, но больше нельзя мутировать",
          variant: "destructive",
        });
      }

      setIsMutating(false);
      setSelectedNFT(null);
    }, 2000);
  };

  const activatePromoCode = () => {
    if (promoCode.toLowerCase() === 'setup') {
      setUser(prev => prev ? { ...prev, isAdmin: true } : null);
      toast({
        title: "🔑 Админ доступ получен!",
        description: "Админ панель активирована",
      });
      setPromoCode('');
    } else {
      toast({
        title: "Неверный код",
        description: "Попробуйте другой код",
        variant: "destructive",
      });
    }
  };

  const login = () => {
    if (!username.trim()) {
      toast({
        title: "Введите никнейм",
        variant: "destructive",
      });
      return;
    }
    setUser({ username: username.trim(), isAdmin: false });
    setShowAuth(false);
    toast({
      title: "Добро пожаловать!",
      description: `Привет, ${username}!`,
    });
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center p-4">
        <Card className="bg-black/40 backdrop-blur-sm border-2 border-purple-500 p-8 max-w-md w-full neon-box">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold mb-2 neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              NFT CLICKER
            </h1>
            <p className="text-purple-300">Войди в игру</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-purple-300 mb-2 block">Никнейм</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && login()}
                className="w-full px-4 py-3 bg-black/60 border-2 border-purple-500/50 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="Введи свой никнейм"
              />
            </div>
            <Button
              onClick={login}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              Войти в игру
            </Button>
          </div>
        </Card>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
          .neon-text {
            text-shadow: 0 0 10px rgba(155, 135, 245, 0.8),
                         0 0 20px rgba(155, 135, 245, 0.6),
                         0 0 30px rgba(155, 135, 245, 0.4);
          }
          .neon-box {
            box-shadow: 0 0 20px rgba(155, 135, 245, 0.4),
                        inset 0 0 20px rgba(155, 135, 245, 0.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-8 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-bold">{user?.username}</p>
                {user?.isAdmin && <Badge className="bg-red-600 text-xs">ADMIN</Badge>}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAuth(true);
                setUser(null);
                setClicks(0);
                setInventory([]);
              }}
              className="border-purple-500 text-purple-300 hover:bg-purple-600"
            >
              Выйти
            </Button>
          </div>
          <h1 className="text-6xl font-bold mb-2 neon-text animate-pulse" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            NFT CLICKER
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-purple-500 neon-box">
              <p className="text-sm text-purple-300">Кликов</p>
              <p className="text-3xl font-bold neon-text">{Math.floor(clicks)}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-pink-500 neon-box-pink">
              <p className="text-sm text-pink-300">CPS</p>
              <p className="text-3xl font-bold text-pink-400">{totalCPS}</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className={`grid w-full ${user?.isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-black/40 backdrop-blur-sm border border-purple-500/30 mb-6`}>
            <TabsTrigger value="game" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Icon name="Gamepad2" className="mr-2" size={18} />
              Игра
            </TabsTrigger>
            <TabsTrigger value="shop" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Icon name="ShoppingBag" className="mr-2" size={18} />
              Магазин
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Icon name="Package" className="mr-2" size={18} />
              Инвентарь ({inventory.length})
            </TabsTrigger>
            <TabsTrigger value="mutation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Icon name="Dna" className="mr-2" size={18} />
              Мутации
            </TabsTrigger>
            {user?.isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Icon name="Shield" className="mr-2" size={18} />
                Админка
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="game">
            <div className="flex flex-col items-center justify-center py-12">
              <Button
                onClick={handleClick}
                disabled={clickWarnings >= 3}
                className="w-64 h-64 rounded-full text-6xl neon-button hover:scale-110 transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #9b87f5 0%, #D946EF 100%)',
                  boxShadow: '0 0 60px rgba(155, 135, 245, 0.8), 0 0 100px rgba(217, 70, 239, 0.6)',
                }}
              >
                <span className="relative z-10 group-hover:scale-110 transition-transform">
                  💎
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Button>
              
              <div className="mt-8 text-center">
                <p className="text-2xl text-purple-300 mb-2">Сила клика: <span className="text-white font-bold">{clickPower}</span></p>
                {clickWarnings > 0 && clickWarnings < 3 && (
                  <Badge variant="destructive" className="mt-2">
                    ⚠️ Предупреждений: {clickWarnings}/3
                  </Badge>
                )}
                {clickWarnings >= 3 && (
                  <Badge variant="destructive" className="mt-2 text-lg">
                    🚫 АККАУНТ ЗАБАНЕН
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shop">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-sm border-2 border-purple-500 p-6 neon-box hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      NFT КЕЙС
                    </h3>
                    <p className="text-purple-300 text-sm">Получи случайный NFT</p>
                  </div>
                  <div className="text-5xl">📦</div>
                </div>
                
                <div className="space-y-2 mb-4 text-sm">
                  {Object.entries(rarityConfig).map(([key, config]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span style={{ color: config.color }}>{config.name}</span>
                      <Badge variant="outline" style={{ borderColor: config.color, color: config.color }}>
                        {config.chance}%
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={openCase}
                  disabled={clicks < casePrice || isOpening}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isOpening ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" />
                      Открытие...
                    </>
                  ) : (
                    `Открыть за ${casePrice} кликов`
                  )}
                </Button>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-2 border-blue-500 p-6 neon-box-blue hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      УЛУЧШЕНИЕ КЛИКА
                    </h3>
                    <p className="text-blue-300 text-sm">Увеличь силу клика на +1</p>
                  </div>
                  <div className="text-5xl">⚡</div>
                </div>
                
                <div className="mb-4 text-center">
                  <p className="text-4xl font-bold text-blue-400">{clickPower}</p>
                  <p className="text-sm text-blue-300">Текущая сила</p>
                </div>

                <Button
                  onClick={upgradeClick}
                  disabled={clicks < upgradePrice}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  size="lg"
                >
                  Улучшить за {upgradePrice} кликов
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            {inventory.length === 0 ? (
              <Card className="bg-black/40 backdrop-blur-sm border-2 border-purple-500/30 p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl text-purple-300">Инвентарь пуст</p>
                <p className="text-sm text-gray-400 mt-2">Открой кейс в магазине!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((nft) => (
                  <Card
                    key={nft.id}
                    className="bg-black/40 backdrop-blur-sm border-2 p-4 hover:scale-105 transition-all"
                    style={{
                      borderColor: rarityConfig[nft.rarity].color,
                      boxShadow: `0 0 20px ${rarityConfig[nft.rarity].color}40`,
                    }}
                  >
                    <div className="text-center mb-3">
                      <div className="text-6xl mb-2">{nft.image}</div>
                      <div className="flex items-center justify-center gap-2">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: rarityConfig[nft.rarity].color,
                            color: rarityConfig[nft.rarity].color,
                          }}
                        >
                          {rarityConfig[nft.rarity].name}
                        </Badge>
                        {nft.mutated && <Badge variant="secondary" className="text-xs">🧬</Badge>}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-center">{nft.name}</h4>
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Icon name="TrendingUp" size={16} />
                      <span className="font-bold">+{nft.cps} CPS</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mutation">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-sm border-2 border-green-500 p-6 neon-box-green">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">🧬</div>
                  <h3 className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    МАШИНА МУТАЦИЙ
                  </h3>
                  <p className="text-green-300 text-sm mt-2">Попробуй улучшить редкость NFT</p>
                  <Badge variant="destructive" className="mt-2">Только 1 попытка на NFT!</Badge>
                </div>
                <div className="space-y-3 text-sm text-gray-300 mb-4">
                  <p>• Цена: {mutationPrice} кликов</p>
                  <p>• Шанс успеха: 50%</p>
                  <p>• При успехе: редкость повышается</p>
                  <p>• При неудаче: NFT остаётся прежним</p>
                </div>
                {selectedNFT ? (
                  <div className="space-y-3">
                    <Card
                      className="bg-black/60 border-2 p-3"
                      style={{
                        borderColor: rarityConfig[selectedNFT.rarity].color,
                        boxShadow: `0 0 15px ${rarityConfig[selectedNFT.rarity].color}40`,
                      }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-1">{selectedNFT.image}</div>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: rarityConfig[selectedNFT.rarity].color,
                            color: rarityConfig[selectedNFT.rarity].color,
                          }}
                        >
                          {rarityConfig[selectedNFT.rarity].name}
                        </Badge>
                        <p className="text-xs mt-2">{selectedNFT.name}</p>
                        <p className="text-green-400 text-sm">+{selectedNFT.cps} CPS</p>
                      </div>
                    </Card>
                    <div className="flex gap-2">
                      <Button
                        onClick={mutateNFT}
                        disabled={isMutating || selectedNFT.mutated}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isMutating ? (
                          <>
                            <Icon name="Loader2" className="mr-2 animate-spin" />
                            Мутация...
                          </>
                        ) : selectedNFT.mutated ? (
                          'Уже мутирован'
                        ) : (
                          `Мутировать за ${mutationPrice}`
                        )}
                      </Button>
                      <Button
                        onClick={() => setSelectedNFT(null)}
                        variant="outline"
                        className="border-green-500 text-green-300"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400">Выбери NFT из списка справа →</p>
                )}
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-2 border-purple-500/30 p-6">
                <h4 className="font-bold mb-4 text-center">Выбери NFT для мутации</h4>
                {inventory.length === 0 ? (
                  <p className="text-center text-gray-400">Инвентарь пуст</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {inventory.map((nft) => (
                      <Card
                        key={nft.id}
                        onClick={() => !nft.mutated && setSelectedNFT(nft)}
                        className={`bg-black/60 border-2 p-3 cursor-pointer transition-all ${
                          selectedNFT?.id === nft.id ? 'scale-105' : 'hover:scale-102'
                        } ${nft.mutated ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          borderColor: selectedNFT?.id === nft.id ? rarityConfig[nft.rarity].color : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{nft.image}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: rarityConfig[nft.rarity].color,
                                  color: rarityConfig[nft.rarity].color,
                                }}
                                className="text-xs"
                              >
                                {rarityConfig[nft.rarity].name}
                              </Badge>
                              {nft.mutated && <Badge variant="secondary" className="text-xs">🧬</Badge>}
                            </div>
                            <p className="text-xs text-gray-400">{nft.name}</p>
                            <p className="text-green-400 text-sm">+{nft.cps} CPS</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {user?.isAdmin && (
            <TabsContent value="admin">
              <Card className="bg-black/40 backdrop-blur-sm border-2 border-red-500 p-6 neon-box-red">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-2">🛡️</div>
                  <h3 className="text-3xl font-bold text-red-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    АДМИН ПАНЕЛЬ
                  </h3>
                  <Badge className="bg-red-600 mt-2">Доступ ограничен</Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      setClicks(prev => prev + 10000);
                      toast({ title: "✅ Выдано 10,000 кликов" });
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Icon name="Plus" className="mr-2" />
                    +10,000 кликов
                  </Button>
                  <Button
                    onClick={() => {
                      const adminNFT: NFT = {
                        id: Date.now().toString(),
                        name: 'Admin NFT #9999',
                        rarity: 'admin',
                        cps: 1000,
                        image: '👑',
                        mutated: true,
                      };
                      setInventory(prev => [...prev, adminNFT]);
                      toast({ title: "✅ Админ NFT выдан" });
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Icon name="Crown" className="mr-2" />
                    Выдать Admin NFT
                  </Button>
                  <Button
                    onClick={() => {
                      setClickPower(prev => prev + 10);
                      toast({ title: "✅ Сила клика +10" });
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Icon name="Zap" className="mr-2" />
                    +10 к силе клика
                  </Button>
                  <Button
                    onClick={() => {
                      setInventory([]);
                      setClicks(0);
                      setClickPower(1);
                      toast({ title: "✅ Прогресс сброшен" });
                    }}
                    variant="destructive"
                  >
                    <Icon name="RotateCcw" className="mr-2" />
                    Сбросить прогресс
                  </Button>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <Card className="mt-6 bg-black/40 backdrop-blur-sm border-2 border-cyan-500 p-4 neon-box-cyan">
          <div className="flex items-center gap-3">
            <Icon name="Gift" className="text-cyan-400" size={32} />
            <div className="flex-1">
              <h4 className="font-bold text-cyan-400 mb-1">Промокод</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && activatePromoCode()}
                  className="flex-1 px-3 py-2 bg-black/60 border-2 border-cyan-500/50 rounded text-white focus:border-cyan-500 focus:outline-none text-sm"
                  placeholder="Введи промокод..."
                />
                <Button
                  onClick={activatePromoCode}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  Активировать
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;700&display=swap');
        
        .neon-text {
          text-shadow: 0 0 10px rgba(155, 135, 245, 0.8),
                       0 0 20px rgba(155, 135, 245, 0.6),
                       0 0 30px rgba(155, 135, 245, 0.4);
        }
        
        .neon-box {
          box-shadow: 0 0 20px rgba(155, 135, 245, 0.4),
                      inset 0 0 20px rgba(155, 135, 245, 0.1);
        }
        
        .neon-box-pink {
          box-shadow: 0 0 20px rgba(217, 70, 239, 0.4),
                      inset 0 0 20px rgba(217, 70, 239, 0.1);
        }
        
        .neon-box-blue {
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.4),
                      inset 0 0 20px rgba(14, 165, 233, 0.1);
        }
        
        .neon-box-green {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.4),
                      inset 0 0 20px rgba(34, 197, 94, 0.1);
        }
        
        .neon-box-red {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.4),
                      inset 0 0 20px rgba(239, 68, 68, 0.1);
        }
        
        .neon-box-cyan {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.4),
                      inset 0 0 20px rgba(6, 182, 212, 0.1);
        }
        
        .neon-button {
          animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 60px rgba(155, 135, 245, 0.8), 0 0 100px rgba(217, 70, 239, 0.6);
          }
          50% {
            box-shadow: 0 0 80px rgba(155, 135, 245, 1), 0 0 120px rgba(217, 70, 239, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;