/**
 * The canonical ingredients a cocktail can call for.
 *
 * This list is what makes "what can I make tonight" possible at all. A recipe
 * asks for gin; a bar owns Tanqueray, Hendrick's and Bombay. Without a name both
 * sides agree on, those are unrelated strings. Every product maps to one entry
 * here, every recipe line points at one, and the question becomes set
 * arithmetic.
 *
 * `aliases` is how a product finds its entry without anyone typing the mapping:
 * brands, spellings and the Hebrew a bar actually writes. Matching is done on a
 * normalised form, so case, quotes and the various apostrophes in "ג'ין" do not
 * each need their own line.
 *
 * `kind` drives what a shelf can be filtered by, and tells a syrup apart from a
 * spirit when a recipe produces one.
 */
export const INGREDIENTS = [
    // ── Spirits ──
    { slug: 'gin', he: 'ג׳ין', en: 'Gin', kind: 'spirit', aliases: ['gin', 'ג׳ין', 'גין', 'tanqueray', 'טנקרי', 'bombay', 'בומביי', 'bombay sapphire', 'בומביי ספייר', 'hendricks', 'הנדריקס', 'beefeater', 'ביפיטר', 'gordons', 'גורדונס'] },
    { slug: 'vodka', he: 'וודקה', en: 'Vodka', kind: 'spirit', aliases: ['vodka', 'וודקה', 'ודקה', 'absolut', 'אבסולוט', 'smirnoff', 'סמירנוף', 'grey goose', 'גריי גוס', 'belvedere', 'בלוודר', 'stoli', 'סטולי'] },
    { slug: 'white_rum', he: 'רום לבן', en: 'White Rum', kind: 'spirit', aliases: ['white rum', 'light rum', 'רום לבן', 'bacardi', 'בקרדי', 'havana club 3', 'הוואנה קלאב'] },
    { slug: 'dark_rum', he: 'רום כהה', en: 'Dark Rum', kind: 'spirit', aliases: ['dark rum', 'aged rum', 'gold rum', 'רום כהה', 'רום זהוב', 'רום מיושן', 'myers', 'מאיירס', 'appleton', 'אפלטון'] },
    { slug: 'tequila', he: 'טקילה', en: 'Tequila', kind: 'spirit', aliases: ['tequila', 'טקילה', 'blanco', 'silver tequila', 'jose cuervo', 'חוזה קוארבו', 'olmeca', 'אולמקה', 'patron', 'פטרון'] },
    { slug: 'mezcal', he: 'מסקל', en: 'Mezcal', kind: 'spirit', aliases: ['mezcal', 'mescal', 'מסקל', 'מזקל'] },
    { slug: 'bourbon', he: 'בורבון', en: 'Bourbon', kind: 'spirit', aliases: ['bourbon', 'בורבון', 'buffalo trace', 'makers mark', 'מייקרס מארק', 'jim beam', 'ג׳ים בים', 'wild turkey', 'jack daniels', 'ג׳ק דניאלס', 'גק דניאלס', 'tennessee whiskey'] },
    { slug: 'rye_whiskey', he: 'וויסקי שיפון', en: 'Rye Whiskey', kind: 'spirit', aliases: ['rye', 'rye whiskey', 'וויסקי שיפון', 'שיפון'] },
    { slug: 'scotch', he: 'סקוטש', en: 'Scotch Whisky', kind: 'spirit', aliases: ['scotch', 'סקוטש', 'whisky', 'וויסקי', 'johnnie walker', 'ג׳וני ווקר', 'גוני ווקר', 'chivas', 'שיבס', 'macallan', 'מקאלן', 'glenfiddich'] },
    { slug: 'irish_whiskey', he: 'וויסקי אירי', en: 'Irish Whiskey', kind: 'spirit', aliases: ['irish whiskey', 'וויסקי אירי', 'jameson', 'ג׳יימסון', 'גיימסון', 'tullamore'] },
    { slug: 'cognac', he: 'קוניאק', en: 'Cognac', kind: 'spirit', aliases: ['cognac', 'brandy', 'קוניאק', 'ברנדי', 'hennessy', 'הנסי', 'remy martin', 'courvoisier'] },
    { slug: 'cachaca', he: 'קשאסה', en: 'Cachaça', kind: 'spirit', aliases: ['cachaca', 'cachaça', 'קשאסה', 'קאשסה', 'leblon', 'ypioca'] },
    { slug: 'pisco', he: 'פיסקו', en: 'Pisco', kind: 'spirit', aliases: ['pisco', 'פיסקו'] },
    { slug: 'absinthe', he: 'אבסינת', en: 'Absinthe', kind: 'spirit', aliases: ['absinthe', 'אבסינת', 'אבסינט'] },
    { slug: 'arak', he: 'ערק', en: 'Arak', kind: 'spirit', aliases: ['arak', 'ערק', 'עראק', 'ouzo', 'אוזו'] },

    // ── Liqueurs & aperitifs ──
    { slug: 'triple_sec', he: 'טריפל סק', en: 'Triple Sec', kind: 'liqueur', aliases: ['triple sec', 'טריפל סק', 'cointreau', 'קואנטרו', 'curacao', 'קוראסאו', 'orange liqueur', 'ליקר תפוז', 'grand marnier', 'גרנד מרנייה'] },
    { slug: 'campari', he: 'קמפרי', en: 'Campari', kind: 'liqueur', aliases: ['campari', 'קמפרי', 'bitter red'] },
    { slug: 'aperol', he: 'אפרול', en: 'Aperol', kind: 'liqueur', aliases: ['aperol', 'אפרול'] },
    { slug: 'vermouth_sweet', he: 'ורמוט מתוק', en: 'Sweet Vermouth', kind: 'wine', aliases: ['sweet vermouth', 'red vermouth', 'rosso', 'ורמוט מתוק', 'ורמוט אדום', 'martini rosso', 'carpano', 'cinzano rosso'] },
    { slug: 'vermouth_dry', he: 'ורמוט יבש', en: 'Dry Vermouth', kind: 'wine', aliases: ['dry vermouth', 'white vermouth', 'ורמוט יבש', 'ורמוט לבן', 'martini dry', 'noilly prat'] },
    { slug: 'amaretto', he: 'אמרטו', en: 'Amaretto', kind: 'liqueur', aliases: ['amaretto', 'אמרטו', 'disaronno', 'דיסרונו'] },
    { slug: 'coffee_liqueur', he: 'ליקר קפה', en: 'Coffee Liqueur', kind: 'liqueur', aliases: ['coffee liqueur', 'kahlua', 'קלואה', 'ליקר קפה', 'tia maria'] },
    { slug: 'irish_cream', he: 'ליקר שמנת', en: 'Irish Cream', kind: 'liqueur', aliases: ['baileys', 'ביילי׳ס', 'בייליס', 'irish cream', 'ליקר שמנת'] },
    { slug: 'elderflower_liqueur', he: 'ליקר סמבוק', en: 'Elderflower Liqueur', kind: 'liqueur', aliases: ['st germain', 'elderflower', 'סמבוק', 'ליקר סמבוק'] },
    { slug: 'peach_liqueur', he: 'ליקר אפרסק', en: 'Peach Liqueur', kind: 'liqueur', aliases: ['peach schnapps', 'ליקר אפרסק', 'אפרסק'] },
    { slug: 'maraschino', he: 'מרסקינו', en: 'Maraschino Liqueur', kind: 'liqueur', aliases: ['maraschino', 'מרסקינו', 'luxardo'] },
    { slug: 'green_chartreuse', he: 'שארטרז ירוק', en: 'Green Chartreuse', kind: 'liqueur', aliases: ['chartreuse', 'שארטרז', 'green chartreuse'] },
    { slug: 'cherry_liqueur', he: 'ליקר דובדבן', en: 'Cherry Liqueur', kind: 'liqueur', aliases: ['cherry heering', 'cherry brandy', 'ליקר דובדבן'] },
    { slug: 'banana_liqueur', he: 'ליקר בננה', en: 'Banana Liqueur', kind: 'liqueur', aliases: ['creme de banane', 'ליקר בננה'] },
    { slug: 'creme_de_cacao', he: 'ליקר שוקולד', en: 'Crème de Cacao', kind: 'liqueur', aliases: ['creme de cacao', 'ליקר שוקולד', 'ליקר קקאו'] },
    { slug: 'creme_de_menthe', he: 'ליקר מנטה', en: 'Crème de Menthe', kind: 'liqueur', aliases: ['creme de menthe', 'ליקר מנטה'] },
    { slug: 'creme_de_cassis', he: 'ליקר דומדמניות', en: 'Crème de Cassis', kind: 'liqueur', aliases: ['cassis', 'creme de cassis', 'ליקר דומדמניות'] },
    { slug: 'limoncello', he: 'לימונצ׳לו', en: 'Limoncello', kind: 'liqueur', aliases: ['limoncello', 'לימונצ׳לו', 'לימונצלו'] },

    // ── Wine, beer & bubbles ──
    { slug: 'prosecco', he: 'פרוסקו', en: 'Prosecco', kind: 'wine', aliases: ['prosecco', 'פרוסקו', 'sparkling wine', 'יין מבעבע', 'cava', 'champagne', 'שמפניה'] },
    { slug: 'red_wine', he: 'יין אדום', en: 'Red Wine', kind: 'wine', aliases: ['red wine', 'יין אדום', 'cabernet', 'קברנה', 'merlot', 'מרלו', 'אדום יבש', 'שיראז', 'פינו נואר'] },
    { slug: 'white_wine', he: 'יין לבן', en: 'White Wine', kind: 'wine', aliases: ['white wine', 'יין לבן', 'sauvignon blanc', 'chardonnay', 'שרדונה', 'לבן יבש', 'סוביניון בלאן', 'ריזלינג'] },
    { slug: 'beer', he: 'בירה', en: 'Beer', kind: 'beer', aliases: ['beer', 'בירה', 'lager', 'לאגר', 'heineken', 'הייניקן', 'tuborg', 'טובורג', 'goldstar', 'גולדסטאר'] },

    // ── Juices & fresh ──
    { slug: 'lime_juice', he: 'מיץ ליים', en: 'Lime Juice', kind: 'juice', aliases: ['lime juice', 'fresh lime', 'מיץ ליים', 'ליים', 'lime'] },
    { slug: 'lemon_juice', he: 'מיץ לימון', en: 'Lemon Juice', kind: 'juice', aliases: ['lemon juice', 'fresh lemon', 'מיץ לימון', 'לימון', 'lemon'] },
    { slug: 'orange_juice', he: 'מיץ תפוזים', en: 'Orange Juice', kind: 'juice', aliases: ['orange juice', 'מיץ תפוזים', 'מיץ תפוז', 'תפוזים'] },
    { slug: 'grapefruit_juice', he: 'מיץ אשכוליות', en: 'Grapefruit Juice', kind: 'juice', aliases: ['grapefruit juice', 'מיץ אשכוליות', 'אשכוליות'] },
    { slug: 'pineapple_juice', he: 'מיץ אננס', en: 'Pineapple Juice', kind: 'juice', aliases: ['pineapple juice', 'מיץ אננס', 'אננס'] },
    { slug: 'cranberry_juice', he: 'מיץ חמוציות', en: 'Cranberry Juice', kind: 'juice', aliases: ['cranberry juice', 'מיץ חמוציות', 'חמוציות'] },
    { slug: 'tomato_juice', he: 'מיץ עגבניות', en: 'Tomato Juice', kind: 'juice', aliases: ['tomato juice', 'מיץ עגבניות'] },
    { slug: 'apple_juice', he: 'מיץ תפוחים', en: 'Apple Juice', kind: 'juice', aliases: ['apple juice', 'מיץ תפוחים'] },
    { slug: 'coconut_cream', he: 'קרם קוקוס', en: 'Coconut Cream', kind: 'other', aliases: ['coconut cream', 'cream of coconut', 'קרם קוקוס', 'קוקוס'] },
    { slug: 'cream', he: 'שמנת', en: 'Cream', kind: 'other', aliases: ['cream', 'heavy cream', 'שמנת', 'שמנת מתוקה'] },
    { slug: 'milk', he: 'חלב', en: 'Milk', kind: 'other', aliases: ['milk', 'חלב'] },
    { slug: 'egg_white', he: 'חלבון ביצה', en: 'Egg White', kind: 'other', aliases: ['egg white', 'חלבון', 'חלבון ביצה'] },
    { slug: 'espresso', he: 'אספרסו', en: 'Espresso', kind: 'other', aliases: ['espresso', 'אספרסו', 'coffee', 'קפה'] },
    { slug: 'mint', he: 'נענע', en: 'Mint', kind: 'garnish', aliases: ['mint', 'mint leaves', 'נענע', 'מנטה'] },
    { slug: 'basil', he: 'בזיליקום', en: 'Basil', kind: 'garnish', aliases: ['basil', 'בזיליקום'] },
    { slug: 'cucumber', he: 'מלפפון', en: 'Cucumber', kind: 'garnish', aliases: ['cucumber', 'מלפפון'] },
    { slug: 'orange_peel', he: 'קליפת תפוז', en: 'Orange Peel', kind: 'garnish', aliases: ['orange peel', 'orange twist', 'קליפת תפוז'] },
    { slug: 'lemon_peel', he: 'קליפת לימון', en: 'Lemon Peel', kind: 'garnish', aliases: ['lemon peel', 'lemon twist', 'קליפת לימון'] },
    { slug: 'olive', he: 'זית', en: 'Olive', kind: 'garnish', aliases: ['olive', 'olives', 'זית', 'זיתים'] },
    { slug: 'cherry_garnish', he: 'דובדבן קוקטייל', en: 'Cocktail Cherry', kind: 'garnish', aliases: ['cocktail cherry', 'maraschino cherry', 'דובדבן'] },

    // ── Syrups & sweeteners ──
    { slug: 'simple_syrup', he: 'סירופ סוכר', en: 'Simple Syrup', kind: 'syrup', aliases: ['simple syrup', 'sugar syrup', 'סירופ סוכר', 'סירופ פשוט'] },
    { slug: 'demerara_syrup', he: 'סירופ דמררה', en: 'Demerara Syrup', kind: 'syrup', aliases: ['demerara syrup', 'rich syrup', 'סירופ דמררה'] },
    { slug: 'honey_syrup', he: 'סירופ דבש', en: 'Honey Syrup', kind: 'syrup', aliases: ['honey syrup', 'סירופ דבש'] },
    { slug: 'agave_syrup', he: 'סירופ אגבה', en: 'Agave Syrup', kind: 'syrup', aliases: ['agave', 'agave syrup', 'סירופ אגבה', 'אגבה'] },
    { slug: 'grenadine', he: 'גרנדין', en: 'Grenadine', kind: 'syrup', aliases: ['grenadine', 'גרנדין', 'סירופ רימונים'] },
    { slug: 'orgeat', he: 'אורז׳ה', en: 'Orgeat', kind: 'syrup', aliases: ['orgeat', 'אורז׳ה', 'אורזה', 'סירופ שקדים'] },
    { slug: 'passionfruit_syrup', he: 'סירופ פסיפלורה', en: 'Passionfruit Syrup', kind: 'syrup', aliases: ['passionfruit syrup', 'passion fruit syrup', 'סירופ פסיפלורה'] },
    { slug: 'raspberry_syrup', he: 'סירופ פטל', en: 'Raspberry Syrup', kind: 'syrup', aliases: ['raspberry syrup', 'סירופ פטל'] },
    { slug: 'vanilla_syrup', he: 'סירופ וניל', en: 'Vanilla Syrup', kind: 'syrup', aliases: ['vanilla syrup', 'סירופ וניל'] },
    { slug: 'cinnamon_syrup', he: 'סירופ קינמון', en: 'Cinnamon Syrup', kind: 'syrup', aliases: ['cinnamon syrup', 'סירופ קינמון'] },
    { slug: 'ginger_syrup', he: 'סירופ ג׳ינג׳ר', en: 'Ginger Syrup', kind: 'syrup', aliases: ['ginger syrup', 'סירופ ג׳ינג׳ר', 'סירופ ג׳ינגר'] },
    { slug: 'sugar', he: 'סוכר', en: 'Sugar', kind: 'other', aliases: ['sugar', 'סוכר', 'caster sugar'] },

    // ── Mixers & bitters ──
    { slug: 'soda_water', he: 'סודה', en: 'Soda Water', kind: 'mixer', aliases: ['soda', 'soda water', 'club soda', 'sparkling water', 'סודה', 'מים מוגזים'] },
    { slug: 'tonic_water', he: 'מי טוניק', en: 'Tonic Water', kind: 'mixer', aliases: ['tonic', 'tonic water', 'טוניק', 'מי טוניק', 'schweppes tonic'] },
    { slug: 'cola', he: 'קולה', en: 'Cola', kind: 'mixer', aliases: ['cola', 'coke', 'coca cola', 'קולה', 'קוקה קולה'] },
    { slug: 'ginger_beer', he: 'ג׳ינג׳ר בירה', en: 'Ginger Beer', kind: 'mixer', aliases: ['ginger beer', 'ג׳ינג׳ר בירה', 'ג׳ינג׳ר אייל', 'ginger ale'] },
    { slug: 'sprite', he: 'ספרייט', en: 'Lemon-Lime Soda', kind: 'mixer', aliases: ['sprite', 'ספרייט', '7up', 'lemonade soda'] },
    { slug: 'angostura', he: 'ביטר אנגוסטורה', en: 'Angostura Bitters', kind: 'bitters', aliases: ['angostura', 'אנגוסטורה', 'bitters', 'ביטר', 'aromatic bitters'] },
    { slug: 'orange_bitters', he: 'ביטר תפוז', en: 'Orange Bitters', kind: 'bitters', aliases: ['orange bitters', 'ביטר תפוז'] },
    { slug: 'peychauds', he: 'ביטר פיישו', en: "Peychaud's Bitters", kind: 'bitters', aliases: ['peychauds', 'peychaud', 'פיישו'] },
    { slug: 'tabasco', he: 'טבסקו', en: 'Tabasco', kind: 'other', aliases: ['tabasco', 'טבסקו', 'hot sauce'] },
    { slug: 'worcestershire', he: 'רוטב worcestershire', en: 'Worcestershire Sauce', kind: 'other', aliases: ['worcestershire', 'ווסטרשייר'] },
    { slug: 'salt', he: 'מלח', en: 'Salt', kind: 'other', aliases: ['salt', 'מלח'] },
    { slug: 'pepper', he: 'פלפל שחור', en: 'Black Pepper', kind: 'other', aliases: ['pepper', 'black pepper', 'פלפל'] },

    // ── Raw materials, for the preparations below the bar ──
    { slug: 'water', he: 'מים', en: 'Water', kind: 'other', aliases: ['water', 'מים'] },
    { slug: 'honey', he: 'דבש', en: 'Honey', kind: 'other', aliases: ['honey', 'דבש'] },
    { slug: 'almonds', he: 'שקדים', en: 'Almonds', kind: 'other', aliases: ['almonds', 'almond', 'שקדים', 'שקד'] },
    { slug: 'pomegranate_juice', he: 'מיץ רימונים', en: 'Pomegranate Juice', kind: 'juice', aliases: ['pomegranate juice', 'מיץ רימונים', 'רימונים'] },
    { slug: 'ginger_root', he: 'ג׳ינג׳ר טרי', en: 'Fresh Ginger', kind: 'other', aliases: ['fresh ginger', 'ginger root', 'ג׳ינג׳ר טרי', 'ג׳ינג׳ר', 'ג׳ינגר'] },
    { slug: 'cinnamon', he: 'קינמון', en: 'Cinnamon', kind: 'other', aliases: ['cinnamon', 'cinnamon stick', 'קינמון'] },
    { slug: 'vanilla', he: 'וניל', en: 'Vanilla', kind: 'other', aliases: ['vanilla', 'vanilla pod', 'וניל'] },
]
