/**
 * The shared recipe library.
 *
 * Every bar reads these; no bar owns them. A bar that wants its own version of a
 * classic copies it into its own recipes and edits the copy, so the shared text
 * stays the same for everyone else.
 *
 * Ingredients are written as "slug amount unit", which is short enough to read
 * down the page and keeps the whole library reviewable. Two suffixes change what
 * an ingredient means for "what can I make tonight":
 *
 *   ?  optional   - the drink works without it
 *   *  garnish    - a leaf or a peel, never a reason to say a drink is impossible
 *
 * `produces` marks a recipe that makes an ingredient rather than a drink: the
 * syrups below each produce the syrup that the cocktails above call for.
 *
 * Measures are millilitres unless a unit is given. The instructions here are
 * written for this app rather than lifted from anywhere: the proportions of a
 * classic are common knowledge, the words describing them belong to whoever
 * wrote them.
 */

export const RECIPE_LIBRARY = [
    // ── Gin ──
    {
        slug: 'negroni', he: 'נגרוני', en: 'Negroni', method: 'stirred', glass: 'rocks',
        ingredients: ['gin 30', 'campari 30', 'vermouth_sweet 30', 'orange_peel 1 piece *'],
        he_steps: ['ערבב את שלושת המרכיבים בכוס ערבוב עם קרח עד שהיא מתקררת.', 'סנן לכוס רוקס על קוביית קרח גדולה.', 'סחט קליפת תפוז מעל המשקה והנח אותה בכוס.'],
        en_steps: ['Stir all three with ice until cold.', 'Strain into a rocks glass over a large cube.', 'Express an orange peel over the drink and drop it in.'],
    },
    {
        slug: 'martini', he: 'מרטיני יבש', en: 'Dry Martini', method: 'stirred', glass: 'coupe',
        ingredients: ['gin 60', 'vermouth_dry 10', 'orange_bitters 1 dash ?', 'olive 1 piece *'],
        he_steps: ['ערבב ג׳ין וורמוט עם הרבה קרח, כ-30 שניות.', 'סנן לכוס קוקטייל מצוננת.', 'קשט בזית או בקליפת לימון.'],
        en_steps: ['Stir gin and vermouth with plenty of ice for about 30 seconds.', 'Strain into a chilled cocktail glass.', 'Garnish with an olive or a lemon twist.'],
    },
    {
        slug: 'gin_tonic', he: 'ג׳ין טוניק', en: 'Gin & Tonic', method: 'built', glass: 'highball',
        ingredients: ['gin 50', 'tonic_water 150', 'lime_juice 10 ?'],
        he_steps: ['מלא כוס גבוהה בקרח.', 'יצוק ג׳ין ומלא בטוניק.', 'ערבב בעדינות וקשט בפלח ליים.'],
        en_steps: ['Fill a tall glass with ice.', 'Pour the gin and top with tonic.', 'Stir gently and garnish with a lime wedge.'],
    },
    {
        slug: 'tom_collins', he: 'טום קולינס', en: 'Tom Collins', method: 'built', glass: 'highball',
        ingredients: ['gin 50', 'lemon_juice 25', 'simple_syrup 15', 'soda_water 80'],
        he_steps: ['נער ג׳ין, לימון וסירופ עם קרח.', 'סנן לכוס גבוהה מלאה בקרח.', 'מלא בסודה וערבב פעם אחת.'],
        en_steps: ['Shake gin, lemon and syrup with ice.', 'Strain into a tall glass full of ice.', 'Top with soda and stir once.'],
    },
    {
        slug: 'gimlet', he: 'גימלט', en: 'Gimlet', method: 'shaken', glass: 'coupe',
        ingredients: ['gin 60', 'lime_juice 25', 'simple_syrup 20'],
        he_steps: ['נער הכל עם קרח עד שהשייקר מתקרר.', 'סנן לכוס מצוננת.'],
        en_steps: ['Shake everything with ice until the tin is frosted.', 'Strain into a chilled glass.'],
    },
    {
        slug: 'bees_knees', he: 'ביז ניז', en: 'Bee\'s Knees', method: 'shaken', glass: 'coupe',
        ingredients: ['gin 60', 'lemon_juice 22', 'honey_syrup 22'],
        he_steps: ['נער הכל עם קרח.', 'סנן לכוס מצוננת וקשט בקליפת לימון.'],
        en_steps: ['Shake everything with ice.', 'Strain into a chilled glass and garnish with a lemon twist.'],
    },
    {
        slug: 'last_word', he: 'הלאסט וורד', en: 'Last Word', method: 'shaken', glass: 'coupe',
        ingredients: ['gin 22', 'green_chartreuse 22', 'maraschino 22', 'lime_juice 22'],
        he_steps: ['ארבעה מרכיבים בחלקים שווים — נער עם קרח.', 'סנן לכוס מצוננת.'],
        en_steps: ['Four equal parts - shake with ice.', 'Strain into a chilled glass.'],
    },
    {
        slug: 'french_75', he: 'פרנץ׳ 75', en: 'French 75', method: 'shaken', glass: 'flute',
        ingredients: ['gin 30', 'lemon_juice 15', 'simple_syrup 10', 'prosecco 60'],
        he_steps: ['נער ג׳ין, לימון וסירופ עם קרח.', 'סנן לכוס שמפניה.', 'מלא ביין מבעבע.'],
        en_steps: ['Shake gin, lemon and syrup with ice.', 'Strain into a flute.', 'Top with sparkling wine.'],
    },
    {
        slug: 'southside', he: 'סאות׳סייד', en: 'Southside', method: 'shaken', glass: 'coupe',
        ingredients: ['gin 60', 'lime_juice 25', 'simple_syrup 20', 'mint 8 leaf'],
        he_steps: ['נער הכל עם קרח, כולל עלי הנענע.', 'סנן סינון כפול לכוס מצוננת.'],
        en_steps: ['Shake everything with ice, mint leaves included.', 'Double strain into a chilled glass.'],
    },
    {
        slug: 'bramble', he: 'ברמבל', en: 'Bramble', method: 'built', glass: 'rocks',
        ingredients: ['gin 50', 'lemon_juice 25', 'simple_syrup 15', 'creme_de_cassis 15'],
        he_steps: ['נער ג׳ין, לימון וסירופ וצוק על קרח גרוס.', 'יצוק את הקאסיס מעל כך שיזלוג פנימה.'],
        en_steps: ['Shake gin, lemon and syrup, pour over crushed ice.', 'Drizzle the cassis over the top so it bleeds down.'],
    },

    // ── Vodka ──
    {
        slug: 'moscow_mule', he: 'מוסקו מיול', en: 'Moscow Mule', method: 'built', glass: 'mug',
        ingredients: ['vodka 50', 'lime_juice 15', 'ginger_beer 120', 'mint 1 sprig *'],
        he_steps: ['מלא ספל נחושת או כוס גבוהה בקרח.', 'יצוק וודקה וליים, מלא בג׳ינג׳ר בירה.'],
        en_steps: ['Fill a copper mug or tall glass with ice.', 'Pour the vodka and lime, top with ginger beer.'],
    },
    {
        slug: 'espresso_martini', he: 'אספרסו מרטיני', en: 'Espresso Martini', method: 'shaken', glass: 'coupe',
        ingredients: ['vodka 50', 'coffee_liqueur 20', 'espresso 30', 'simple_syrup 10 ?'],
        he_steps: ['נער חזק מאוד עם קרח — החוזק הוא מה שיוצר את הקצף.', 'סנן לכוס מצוננת וקשט בשלוש פולי קפה.'],
        en_steps: ['Shake hard with ice - the force is what builds the foam.', 'Strain into a chilled glass and garnish with three coffee beans.'],
    },
    {
        slug: 'cosmopolitan', he: 'קוסמופוליטן', en: 'Cosmopolitan', method: 'shaken', glass: 'coupe',
        ingredients: ['vodka 45', 'triple_sec 15', 'lime_juice 15', 'cranberry_juice 30'],
        he_steps: ['נער הכל עם קרח.', 'סנן לכוס מצוננת וסחט קליפת תפוז מעל.'],
        en_steps: ['Shake everything with ice.', 'Strain into a chilled glass and express an orange peel over it.'],
    },
    {
        slug: 'bloody_mary', he: 'בלאדי מרי', en: 'Bloody Mary', method: 'built', glass: 'highball',
        ingredients: ['vodka 50', 'tomato_juice 120', 'lemon_juice 15', 'worcestershire 2 dash', 'tabasco 2 dash', 'salt 1 pinch', 'pepper 1 pinch'],
        he_steps: ['גלגל את כל המרכיבים בין שתי כוסות — נענוע מקציף אותו יתר על המידה.', 'הגש על קרח בכוס גבוהה, עם סלרי או לימון.'],
        en_steps: ['Roll everything between two glasses - shaking makes it frothy.', 'Serve over ice in a tall glass with celery or lemon.'],
    },
    {
        slug: 'sea_breeze', he: 'סי ברין', en: 'Sea Breeze', method: 'built', glass: 'highball',
        ingredients: ['vodka 40', 'cranberry_juice 100', 'grapefruit_juice 40'],
        he_steps: ['יצוק הכל על קרח בכוס גבוהה וערבב.'],
        en_steps: ['Pour everything over ice in a tall glass and stir.'],
    },
    {
        slug: 'screwdriver', he: 'סקרוודרייבר', en: 'Screwdriver', method: 'built', glass: 'highball',
        ingredients: ['vodka 50', 'orange_juice 120'],
        he_steps: ['יצוק על קרח בכוס גבוהה וערבב.'],
        en_steps: ['Pour over ice in a tall glass and stir.'],
    },
    {
        slug: 'black_russian', he: 'בלאק רשן', en: 'Black Russian', method: 'built', glass: 'rocks',
        ingredients: ['vodka 50', 'coffee_liqueur 25'],
        he_steps: ['יצוק על קרח בכוס רוקס וערבב.'],
        en_steps: ['Pour over ice in a rocks glass and stir.'],
    },
    {
        slug: 'white_russian', he: 'וויט רשן', en: 'White Russian', method: 'built', glass: 'rocks',
        ingredients: ['vodka 50', 'coffee_liqueur 25', 'cream 25'],
        he_steps: ['יצוק וודקה וליקר קפה על קרח.', 'יצוק שמנת מעל בעדינות.'],
        en_steps: ['Pour vodka and coffee liqueur over ice.', 'Float the cream gently on top.'],
    },

    // ── Rum ──
    {
        slug: 'daiquiri', he: 'דאיקירי', en: 'Daiquiri', method: 'shaken', glass: 'coupe',
        ingredients: ['white_rum 60', 'lime_juice 25', 'simple_syrup 20'],
        he_steps: ['נער חזק עם קרח.', 'סנן לכוס מצוננת.'],
        en_steps: ['Shake hard with ice.', 'Strain into a chilled glass.'],
    },
    {
        slug: 'mojito', he: 'מוחיטו', en: 'Mojito', method: 'built', glass: 'highball',
        ingredients: ['white_rum 50', 'lime_juice 25', 'simple_syrup 20', 'mint 10 leaf', 'soda_water 80'],
        he_steps: ['מעך קלות את הנענע עם הליים בתחתית הכוס — מעיכה חזקה מרירה אותה.', 'הוסף רום וסירופ, מלא בקרח גרוס.', 'מלא בסודה וערבב מלמטה למעלה.'],
        en_steps: ['Press the mint lightly with the lime - crushing it turns it bitter.', 'Add rum and syrup, fill with crushed ice.', 'Top with soda and churn from the bottom up.'],
    },
    {
        slug: 'mai_tai', he: 'מאי טאי', en: 'Mai Tai', method: 'shaken', glass: 'rocks',
        ingredients: ['white_rum 30', 'dark_rum 30', 'triple_sec 15', 'orgeat 15', 'lime_juice 25', 'mint 1 sprig *'],
        he_steps: ['נער הכל עם קרח.', 'יצוק על קרח גרוס וקשט בנענע.'],
        en_steps: ['Shake everything with ice.', 'Pour over crushed ice and garnish with mint.'],
    },
    {
        slug: 'pina_colada', he: 'פינה קולאדה', en: 'Piña Colada', method: 'blended', glass: 'hurricane',
        ingredients: ['white_rum 60', 'coconut_cream 60', 'pineapple_juice 120'],
        he_steps: ['ערבב בבלנדר עם קרח עד למרקם חלק.', 'יצוק לכוס גבוהה.'],
        en_steps: ['Blend with ice until smooth.', 'Pour into a tall glass.'],
    },
    {
        slug: 'dark_n_stormy', he: 'דארק אנד סטורמי', en: "Dark 'n' Stormy", method: 'built', glass: 'highball',
        ingredients: ['dark_rum 50', 'ginger_beer 120', 'lime_juice 15'],
        he_steps: ['מלא כוס גבוהה בקרח, יצוק ג׳ינג׳ר בירה וליים.', 'יצוק את הרום הכהה מעל כך שיישאר שכבה.'],
        en_steps: ['Fill a tall glass with ice, pour ginger beer and lime.', 'Float the dark rum on top so it stays a layer.'],
    },
    {
        slug: 'cuba_libre', he: 'קובה ליברה', en: 'Cuba Libre', method: 'built', glass: 'highball',
        ingredients: ['white_rum 50', 'cola 120', 'lime_juice 15'],
        he_steps: ['יצוק רום וליים על קרח.', 'מלא בקולה.'],
        en_steps: ['Pour rum and lime over ice.', 'Top with cola.'],
    },
    {
        slug: 'painkiller', he: 'פיינקילר', en: 'Painkiller', method: 'shaken', glass: 'highball',
        ingredients: ['dark_rum 60', 'pineapple_juice 120', 'orange_juice 30', 'coconut_cream 30'],
        he_steps: ['נער הכל עם קרח.', 'יצוק על קרח וגרד מוסקט מעל.'],
        en_steps: ['Shake everything with ice.', 'Pour over ice and grate nutmeg on top.'],
    },
    {
        slug: 'caipirinha', he: 'קאיפיריניה', en: 'Caipirinha', method: 'built', glass: 'rocks',
        ingredients: ['cachaca 60', 'lime_juice 25', 'sugar 2 tsp'],
        he_steps: ['מעך פלחי ליים עם הסוכר בתחתית הכוס.', 'הוסף קשאסה וקרח גרוס וערבב.'],
        en_steps: ['Muddle lime wedges with the sugar in the glass.', 'Add cachaça and crushed ice, then churn.'],
    },

    // ── Whiskey ──
    {
        slug: 'old_fashioned', he: 'אולד פאשן', en: 'Old Fashioned', method: 'stirred', glass: 'rocks',
        ingredients: ['bourbon 60', 'demerara_syrup 10', 'angostura 2 dash', 'orange_peel 1 piece *'],
        he_steps: ['ערבב ויסקי, סירופ וביטר עם קרח עד לדילול הנכון.', 'סנן על קוביית קרח גדולה.', 'סחט קליפת תפוז מעל.'],
        en_steps: ['Stir whiskey, syrup and bitters with ice until properly diluted.', 'Strain over a large cube.', 'Express an orange peel over the top.'],
    },
    {
        slug: 'manhattan', he: 'מנהטן', en: 'Manhattan', method: 'stirred', glass: 'coupe',
        ingredients: ['rye_whiskey 60', 'vermouth_sweet 30', 'angostura 2 dash', 'cherry_garnish 1 piece *'],
        he_steps: ['ערבב עם קרח עד שהכוס מתקררת.', 'סנן לכוס מצוננת וקשט בדובדבן.'],
        en_steps: ['Stir with ice until cold.', 'Strain into a chilled glass and garnish with a cherry.'],
    },
    {
        slug: 'whiskey_sour', he: 'וויסקי סאוור', en: 'Whiskey Sour', method: 'shaken', glass: 'rocks',
        ingredients: ['bourbon 60', 'lemon_juice 25', 'simple_syrup 20', 'egg_white 1 piece ?'],
        he_steps: ['אם משתמשים בחלבון — נער קודם בלי קרח כדי להקציף.', 'הוסף קרח ונער שוב.', 'סנן לכוס ופזר טיפות ביטר מעל הקצף.'],
        en_steps: ['With egg white, shake first without ice to build the foam.', 'Add ice and shake again.', 'Strain out and dot bitters across the foam.'],
    },
    {
        slug: 'boulevardier', he: 'בולברדייה', en: 'Boulevardier', method: 'stirred', glass: 'rocks',
        ingredients: ['bourbon 45', 'campari 30', 'vermouth_sweet 30'],
        he_steps: ['ערבב עם קרח וסנן על קוביה גדולה.', 'קשט בקליפת תפוז.'],
        en_steps: ['Stir with ice and strain over a large cube.', 'Garnish with an orange peel.'],
    },
    {
        slug: 'sazerac', he: 'סזרק', en: 'Sazerac', method: 'stirred', glass: 'rocks',
        ingredients: ['rye_whiskey 60', 'demerara_syrup 10', 'peychauds 3 dash', 'absinthe 5'],
        he_steps: ['הרטב כוס מצוננת באבסינת ושפוך את העודף.', 'ערבב ויסקי, סירופ וביטר עם קרח וסנן לתוכה.', 'סחט קליפת לימון מעל ואל תשאיר אותה בכוס.'],
        en_steps: ['Rinse a chilled glass with absinthe and discard the excess.', 'Stir whiskey, syrup and bitters with ice and strain in.', 'Express a lemon peel over it and discard the peel.'],
    },
    {
        slug: 'mint_julep', he: 'מינט ג׳ולפ', en: 'Mint Julep', method: 'built', glass: 'mug',
        ingredients: ['bourbon 60', 'simple_syrup 15', 'mint 10 leaf'],
        he_steps: ['טפח על הנענע בכף היד כדי לשחרר שמנים והנח בכוס.', 'הוסף בורבון וסירופ ומלא בקרח גרוס.', 'ערבב עד שהכוס מכסיפה.'],
        en_steps: ['Clap the mint between your palms and drop it in.', 'Add bourbon and syrup, fill with crushed ice.', 'Churn until the cup frosts.'],
    },
    {
        slug: 'penicillin', he: 'פניצילין', en: 'Penicillin', method: 'shaken', glass: 'rocks',
        ingredients: ['scotch 60', 'lemon_juice 22', 'honey_syrup 22', 'ginger_syrup 10'],
        he_steps: ['נער הכל עם קרח.', 'סנן על קרח וקשט בפרוסת ג׳ינג׳ר מסוכר.'],
        en_steps: ['Shake everything with ice.', 'Strain over ice and garnish with candied ginger.'],
    },
    {
        slug: 'rusty_nail', he: 'ראסטי נייל', en: 'Rusty Nail', method: 'built', glass: 'rocks',
        ingredients: ['scotch 50', 'honey_syrup 15'],
        he_steps: ['יצוק על קרח וערבב.', 'קשט בקליפת לימון.'],
        en_steps: ['Pour over ice and stir.', 'Garnish with a lemon peel.'],
    },
    {
        slug: 'irish_coffee', he: 'אייריש קופי', en: 'Irish Coffee', method: 'built', glass: 'mug',
        ingredients: ['irish_whiskey 40', 'espresso 90', 'demerara_syrup 15', 'cream 30'],
        he_steps: ['ערבב ויסקי, קפה חם וסירופ בספל מחומם.', 'יצוק שמנת מוקצפת קלות מעל, דרך גב כפית.'],
        en_steps: ['Stir whiskey, hot coffee and syrup in a warmed mug.', 'Float lightly whipped cream over the back of a spoon.'],
    },

    // ── Tequila & mezcal ──
    {
        slug: 'margarita', he: 'מרגריטה', en: 'Margarita', method: 'shaken', glass: 'coupe',
        ingredients: ['tequila 50', 'triple_sec 25', 'lime_juice 25', 'salt 1 rim ?'],
        he_steps: ['המלח את שפת הכוס אם רוצים — רק חצי ממנה.', 'נער הכל עם קרח וסנן פנימה.'],
        en_steps: ['Salt half the rim if you want it.', 'Shake everything with ice and strain in.'],
    },
    {
        slug: 'paloma', he: 'פלומה', en: 'Paloma', method: 'built', glass: 'highball',
        ingredients: ['tequila 50', 'grapefruit_juice 100', 'lime_juice 15', 'soda_water 60', 'salt 1 rim ?'],
        he_steps: ['יצוק טקילה, אשכוליות וליים על קרח.', 'מלא בסודה.'],
        en_steps: ['Pour tequila, grapefruit and lime over ice.', 'Top with soda.'],
    },
    {
        slug: 'tommys_margarita', he: 'מרגריטה של טומי', en: "Tommy's Margarita", method: 'shaken', glass: 'rocks',
        ingredients: ['tequila 50', 'lime_juice 25', 'agave_syrup 15'],
        he_steps: ['נער הכל עם קרח.', 'סנן על קרח טרי.'],
        en_steps: ['Shake everything with ice.', 'Strain over fresh ice.'],
    },
    {
        slug: 'mezcal_mule', he: 'מסקל מיול', en: 'Mezcal Mule', method: 'built', glass: 'mug',
        ingredients: ['mezcal 50', 'lime_juice 20', 'ginger_beer 120'],
        he_steps: ['יצוק מסקל וליים על קרח ומלא בג׳ינג׳ר בירה.'],
        en_steps: ['Pour mezcal and lime over ice and top with ginger beer.'],
    },
    {
        slug: 'tequila_sunrise', he: 'טקילה סאנרייז', en: 'Tequila Sunrise', method: 'built', glass: 'highball',
        ingredients: ['tequila 50', 'orange_juice 120', 'grenadine 15'],
        he_steps: ['יצוק טקילה ומיץ תפוזים על קרח.', 'יצוק גרנדין לאט לאורך דופן הכוס — הוא ישקע וייצור את המעבר.'],
        en_steps: ['Pour tequila and orange juice over ice.', 'Pour grenadine slowly down the side - it sinks and makes the gradient.'],
    },

    // ── Aperitivo, bubbles & low ABV ──
    {
        slug: 'aperol_spritz', he: 'אפרול שפריץ', en: 'Aperol Spritz', method: 'built', glass: 'wine',
        ingredients: ['aperol 60', 'prosecco 90', 'soda_water 30', 'orange_peel 1 piece *'],
        he_steps: ['מלא כוס יין בקרח.', 'יצוק פרוסקו, אז אפרול, אז מעט סודה.', 'קשט בפרוסת תפוז.'],
        en_steps: ['Fill a wine glass with ice.', 'Pour the prosecco, then the Aperol, then a splash of soda.', 'Garnish with an orange slice.'],
    },
    {
        slug: 'americano', he: 'אמריקנו', en: 'Americano', method: 'built', glass: 'highball',
        ingredients: ['campari 30', 'vermouth_sweet 30', 'soda_water 90'],
        he_steps: ['יצוק קמפרי וורמוט על קרח.', 'מלא בסודה וקשט בפרוסת תפוז.'],
        en_steps: ['Pour Campari and vermouth over ice.', 'Top with soda and garnish with an orange slice.'],
    },
    {
        slug: 'negroni_sbagliato', he: 'נגרוני סבליאטו', en: 'Negroni Sbagliato', method: 'built', glass: 'rocks',
        ingredients: ['campari 30', 'vermouth_sweet 30', 'prosecco 60'],
        he_steps: ['יצוק קמפרי וורמוט על קרח.', 'מלא ביין מבעבע במקום ג׳ין.'],
        en_steps: ['Pour Campari and vermouth over ice.', 'Top with sparkling wine instead of gin.'],
    },
    {
        slug: 'bellini', he: 'בליני', en: 'Bellini', method: 'built', glass: 'flute',
        ingredients: ['prosecco 100', 'peach_liqueur 30'],
        he_steps: ['יצוק את ליקר האפרסק לכוס שמפניה.', 'מלא בפרוסקו וערבב בעדינות.'],
        en_steps: ['Pour the peach into a flute.', 'Top with prosecco and stir gently.'],
    },
    {
        slug: 'kir_royal', he: 'קיר רויאל', en: 'Kir Royal', method: 'built', glass: 'flute',
        ingredients: ['creme_de_cassis 15', 'prosecco 120'],
        he_steps: ['יצוק קאסיס לכוס שמפניה ומלא ביין מבעבע.'],
        en_steps: ['Pour cassis into a flute and top with sparkling wine.'],
    },
    {
        slug: 'sangria', he: 'סנגריה', en: 'Sangria', method: 'built', glass: 'wine',
        ingredients: ['red_wine 150', 'triple_sec 30', 'orange_juice 60', 'simple_syrup 15'],
        he_steps: ['ערבב הכל עם פירות חתוכים.', 'קרר לפחות שעתיים והגש על קרח.'],
        en_steps: ['Mix everything with chopped fruit.', 'Chill for at least two hours and serve over ice.'],
    },

    // ── Brandy & others ──
    {
        slug: 'sidecar', he: 'סייד קאר', en: 'Sidecar', method: 'shaken', glass: 'coupe',
        ingredients: ['cognac 50', 'triple_sec 25', 'lemon_juice 20'],
        he_steps: ['נער הכל עם קרח.', 'סנן לכוס מצוננת, עם שפה מסוכרת אם רוצים.'],
        en_steps: ['Shake everything with ice.', 'Strain into a chilled glass, sugar rim optional.'],
    },
    {
        slug: 'pisco_sour', he: 'פיסקו סאוור', en: 'Pisco Sour', method: 'shaken', glass: 'coupe',
        ingredients: ['pisco 60', 'lime_juice 25', 'simple_syrup 20', 'egg_white 1 piece', 'angostura 3 dash *'],
        he_steps: ['נער בלי קרח כדי להקציף את החלבון.', 'הוסף קרח ונער שוב, סנן לכוס.', 'פזר טיפות ביטר על הקצף.'],
        en_steps: ['Shake without ice to whip the egg white.', 'Add ice, shake again and strain out.', 'Dot bitters across the foam.'],
    },
    {
        slug: 'brandy_alexander', he: 'ברנדי אלכסנדר', en: 'Brandy Alexander', method: 'shaken', glass: 'coupe',
        ingredients: ['cognac 40', 'creme_de_cacao 30', 'cream 30'],
        he_steps: ['נער הכל עם קרח.', 'סנן לכוס מצוננת וגרד מוסקט מעל.'],
        en_steps: ['Shake everything with ice.', 'Strain into a chilled glass and grate nutmeg over it.'],
    },
    {
        slug: 'grasshopper', he: 'גראסהופר', en: 'Grasshopper', method: 'shaken', glass: 'coupe',
        ingredients: ['creme_de_menthe 30', 'creme_de_cacao 30', 'cream 30'],
        he_steps: ['נער הכל עם קרח וסנן לכוס מצוננת.'],
        en_steps: ['Shake everything with ice and strain into a chilled glass.'],
    },
    {
        slug: 'amaretto_sour', he: 'אמרטו סאוור', en: 'Amaretto Sour', method: 'shaken', glass: 'rocks',
        ingredients: ['amaretto 60', 'bourbon 20', 'lemon_juice 25', 'egg_white 1 piece ?'],
        he_steps: ['נער הכל, קודם בלי קרח אם יש חלבון.', 'סנן על קרח טרי.'],
        en_steps: ['Shake everything, dry first if using egg white.', 'Strain over fresh ice.'],
    },
    {
        slug: 'limoncello_spritz', he: 'לימונצ׳לו שפריץ', en: 'Limoncello Spritz', method: 'built', glass: 'wine',
        ingredients: ['limoncello 50', 'prosecco 90', 'soda_water 30', 'mint 1 sprig *'],
        he_steps: ['מלא כוס יין בקרח ויצוק הכל.', 'ערבב פעם אחת וקשט בנענע.'],
        en_steps: ['Fill a wine glass with ice and pour everything in.', 'Stir once and garnish with mint.'],
    },

    // ── Non-alcoholic ──
    {
        slug: 'virgin_mojito', he: 'מוחיטו ללא אלכוהול', en: 'Virgin Mojito', method: 'built', glass: 'highball',
        ingredients: ['lime_juice 25', 'simple_syrup 20', 'mint 10 leaf', 'soda_water 150'],
        he_steps: ['לחץ קלות על הנענע עם הליים.', 'מלא בקרח גרוס וסודה וערבב.'],
        en_steps: ['Press the mint lightly with the lime.', 'Fill with crushed ice and soda, then churn.'],
    },
    {
        slug: 'shirley_temple', he: 'שירלי טמפל', en: 'Shirley Temple', method: 'built', glass: 'highball',
        ingredients: ['grenadine 20', 'sprite 180', 'cherry_garnish 1 piece *'],
        he_steps: ['יצוק גרנדין על קרח ומלא בספרייט.'],
        en_steps: ['Pour grenadine over ice and top with lemon-lime soda.'],
    },
    {
        slug: 'ginger_lemonade', he: 'לימונדה ג׳ינג׳ר', en: 'Ginger Lemonade', method: 'built', glass: 'highball',
        ingredients: ['lemon_juice 30', 'ginger_syrup 20', 'soda_water 150', 'mint 1 sprig *'],
        he_steps: ['יצוק לימון וסירופ על קרח ומלא בסודה.'],
        en_steps: ['Pour lemon and syrup over ice and top with soda.'],
    },

    // ── Syrups: recipes that make an ingredient ──
    {
        slug: 'make_simple_syrup', he: 'סירופ סוכר', en: 'Simple Syrup', method: 'prep', glass: '',
        produces: 'simple_syrup', yieldMl: 1000,
        ingredients: ['sugar 500 g', 'water 500'],
        he_steps: ['המס סוכר במים חמים ביחס 1:1 עד שהנוזל צלול.', 'קרר ואחסן בבקבוק סגור בקירור עד כחודש.'],
        en_steps: ['Dissolve sugar in hot water, one to one, until clear.', 'Cool and keep refrigerated in a sealed bottle for about a month.'],
    },
    {
        slug: 'make_demerara_syrup', he: 'סירופ דמררה', en: 'Demerara Syrup', method: 'prep', glass: '',
        produces: 'demerara_syrup', yieldMl: 750,
        ingredients: ['sugar 500 g', 'water 250'],
        he_steps: ['המס סוכר דמררה במים ביחס 2:1 — שני חלקי סוכר לחלק מים.', 'קרר ואחסן בקירור. סמיך ועשיר יותר מסירופ רגיל.'],
        en_steps: ['Dissolve demerara sugar in water, two parts sugar to one of water.', 'Cool and refrigerate. Thicker and richer than simple syrup.'],
    },
    {
        slug: 'make_honey_syrup', he: 'סירופ דבש', en: 'Honey Syrup', method: 'prep', glass: '',
        produces: 'honey_syrup', yieldMl: 450,
        ingredients: ['honey 300 g', 'water 100'],
        he_steps: ['ערבב דבש ומים חמים ביחס 3:1.', 'דבש טהור סמיך מכדי להתערבב במשקה קר — זו כל מטרת הדילול.'],
        en_steps: ['Stir honey into hot water, three parts honey to one of water.', 'Neat honey is too thick to mix into a cold drink - that is the whole point of thinning it.'],
    },
    {
        slug: 'make_ginger_syrup', he: 'סירופ ג׳ינג׳ר', en: 'Ginger Syrup', method: 'prep', glass: '',
        produces: 'ginger_syrup', yieldMl: 500,
        ingredients: ['ginger_root 200 g', 'sugar 250 g'],
        he_steps: ['סחט או רסק ג׳ינג׳ר טרי וסנן את הנוזל.', 'ערבב עם סוכר בכמות שווה עד להמסה מלאה.', 'שבוע בקירור.'],
        en_steps: ['Juice or blend fresh ginger and strain the liquid.', 'Stir in an equal weight of sugar until dissolved.', 'Keeps a week refrigerated.'],
    },
    {
        slug: 'make_cinnamon_syrup', he: 'סירופ קינמון', en: 'Cinnamon Syrup', method: 'prep', glass: '',
        produces: 'cinnamon_syrup', yieldMl: 500,
        ingredients: ['cinnamon 4 piece', 'sugar 250 g', 'water 250'],
        he_steps: ['הרתח מים עם מקלות קינמון שבורים והנח להשרות חצי שעה.', 'סנן, הוסף סוכר בכמות שווה והמס.'],
        en_steps: ['Simmer water with broken cinnamon sticks and steep for half an hour.', 'Strain, add an equal weight of sugar and dissolve.'],
    },
    {
        slug: 'make_vanilla_syrup', he: 'סירופ וניל', en: 'Vanilla Syrup', method: 'prep', glass: '',
        produces: 'vanilla_syrup', yieldMl: 500,
        ingredients: ['vanilla 1 piece', 'simple_syrup 500'],
        he_steps: ['חצה מקל וניל וגרד את הזרעים לתוך סירופ סוכר חם.', 'השרה עד לקירור, סנן ואחסן.'],
        en_steps: ['Split a vanilla pod and scrape the seeds into hot simple syrup.', 'Steep until cool, then strain and bottle.'],
    },
    {
        slug: 'make_orgeat', he: 'אורז׳ה', en: 'Orgeat', method: 'prep', glass: '',
        produces: 'orgeat', yieldMl: 600,
        ingredients: ['almonds 250 g', 'sugar 300 g', 'water 300', 'amaretto 15 ?'],
        he_steps: ['השרה שקדים טחונים במים חמים כשעה וסנן דרך בד.', 'הוסף סוכר בכמות שווה למשקל הנוזל והמס.', 'מעט אמרטו או מי פרחים ישמרו עליו ויוסיפו ארומה.'],
        en_steps: ['Steep ground almonds in hot water for an hour and strain through cloth.', 'Add sugar equal to the weight of the liquid and dissolve.', 'A little amaretto or orange flower water preserves it and adds aroma.'],
    },
    {
        slug: 'make_grenadine', he: 'גרנדין', en: 'Grenadine', method: 'prep', glass: '',
        produces: 'grenadine', yieldMl: 500,
        ingredients: ['pomegranate_juice 250', 'sugar 250 g'],
        he_steps: ['חמם מיץ רימונים עם סוכר בכמות שווה — בלי להרתיח.', 'קרר ואחסן בקירור כשבועיים.'],
        en_steps: ['Warm pomegranate juice with an equal weight of sugar - do not boil it.', 'Cool and refrigerate for about two weeks.'],
    },
]
