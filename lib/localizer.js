/**
 * Copied from: https://github.com/jes-sherborne/javascript-localizer
 *
 */

var Localizer = {
    currentLanguage: null,
    fallbackLanguage: null,
    languages: {},
    languageRegEx: new RegExp("^([a-z]+)(-[a-z]+)?$")
};

Localizer.setLanguage = function(languageName) {
    languageName = Localizer.validateLanguageName(languageName);

    if (languageName) {
        Localizer.currentLanguage = Localizer.getOrCreateLanguage(languageName);
    } else {
        Localizer.currentLanguage = null;
    }
};

Localizer.getLanguage = function() {
    if (Localizer.currentLanguage) {
        return Localizer.currentLanguage.name;
    } else {
        return null;
    }
};

Localizer.setFallbackLanguage = function(languageName) {
    languageName = Localizer.validateLanguageName(languageName);

    if (languageName) {
        Localizer.fallbackLanguage = Localizer.getOrCreateLanguage(languageName);
    } else {
        Localizer.fallbackLanguage = null;
    }
};

Localizer.getFallbackLanguage = function() {
    if (Localizer.fallbackLanguage) {
        return Localizer.fallbackLanguage.name;
    } else {
        return null;
    }
};

Localizer.getValue = function(key) {
    var targetValue;

    if (Localizer.currentLanguage) {
        targetValue = Localizer.currentLanguage.getValue(key);
        if (targetValue !== null) {
            return targetValue;
        }
    }

    if (Localizer.fallbackLanguage) {
        return Localizer.fallbackLanguage.getValue(key);
    }

    return null;
};

Localizer.setValues = function(values) {
    var iLanguageSet, thisLanguage, thisLanguageName, iTranslation,thisTranslationSet;

    for (iLanguageSet = 0; iLanguageSet < values.length; iLanguageSet++) {
        thisLanguageName = Localizer.validateLanguageName(values[iLanguageSet].language);
        thisLanguage = Localizer.getOrCreateLanguage(thisLanguageName);
        thisTranslationSet = values[iLanguageSet].translation;

        for (iTranslation = 0; iTranslation < thisTranslationSet.length; iTranslation++) {
            thisLanguage.setValue(thisTranslationSet[iTranslation][0], thisTranslationSet[iTranslation][1]);
        }
    }

};

Localizer.getOrCreateLanguage = function(languageName) {
    var result, baseLanguage, languageNameSplit;

    result = Localizer.languages[languageName];
    if (result) {
        return result;
    }

    languageNameSplit = languageName.split("-");

    baseLanguage = Localizer.languages[languageNameSplit[0]];

    if (!baseLanguage) {
        baseLanguage = new Localizer.TranslationSet(languageNameSplit[0], languageNameSplit[0], "", null);
        Localizer.languages[languageNameSplit[0]] = baseLanguage;
    }

    if (languageNameSplit.length === 1) {
        return baseLanguage;
    }

    result = new Localizer.TranslationSet(languageName, languageNameSplit[0], languageNameSplit[1], baseLanguage);
    Localizer.languages[languageName] = result;

    return result;

};

Localizer.validateLanguageName = function(name) {
    // Acceptable values are null, "", and strings that begin with a group of letters optionally follwed by
    // a dash and another group of letters, e.g., "en" or "en-us".
    // Converts the string to lower case.
    // Converts undefined and "" to null.
    var splitName;
    if (typeof name === "string") {
        if (name.length === 0) {
            return null;
        }
        splitName = name.toLowerCase().match(Localizer.languageRegEx);
        if (splitName) {
            return splitName[0];
        }
    } else if (name == null){
        return null;
    }
    throw new Error("Invalid language name");
};

Localizer.TranslationSet = function(name, language, culture, parent) {
    this.name = name;
    this.language = language;
    this.culture =culture;
    this.parent = parent;

    this.values = {};
};

Localizer.TranslationSet.prototype.getValue = function (key) {
    if (this.values[key] != null) {
        return this.values[key];
    } else if (this.parent) {
        return this.parent.getValue(key);
    }
   return null;
};

Localizer.TranslationSet.prototype.setValue = function (key, value) {
    this.values[key] = value;

    if (value !== null && this.parent) {
        if (this.parent.values[key] == null) {
            // If our parent doesn't have a value for this key, propagate it up
            this.parent.setValue(key, value);
        }
    }
};