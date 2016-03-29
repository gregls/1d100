var dice = {
    roll : function(diceNumber, diceType, freeDice){
        var result = [];
        if (freeDice) {
            for (i=0; i<diceNumber; i++){
                dice = Math.floor((Math.random() * diceType) + 1)
                result.push(dice);
                if (i == 0) {
                    while (dice == diceType) {
                        dice = Math.floor((Math.random() * diceType) + 1)
                        result.push(dice);
                    }
                }
            }
        } else {
            for (i=0; i<diceNumber; i++){
                result.push(Math.floor((Math.random() * diceType) + 1));
            }
        }
        
        return result;
    },
    setResponse: function(message, freeDice, numbers, secret, favorable){
        var response = {
            message : message,
            diceNumber: 0,
            diceType: 0,
            operatorResult: 0,
            freeDice: freeDice,
            secret: secret,
            favorable: favorable
        };
        
        if (numbers) {
            diceNumber = numbers[0];
            data = numbers[1].replace('+', '*+').replace('-', '*-').split('*');
            diceType = data.shift();
            response.message = this.roll(diceNumber, diceType, freeDice);
            response.diceNumber = diceNumber;
            response.diceType = diceType;
            if (data.length > 0) {
                response.operatorResult = eval(data.join(''));
            }
        }
        
        return response;
    },
    parseString : function(message) {
        secret = false;
        if (message.match(/^&/)) {
            secret = true;
        }
        
        if (message.match(/^[!&]{1}\d{1,2}dm\d{1,3}([-+]\d{1,3})*/)) {
            numbers = message.replace('!', '').replace('&', '').split('dm');
            return this.setResponse(message, false, numbers, secret, 'min');
        }
        
        if (message.match(/^[!&]{1}\d{1,2}dM\d{1,3}([-+]\d{1,3})*/)) {
            numbers = message.replace('!', '').replace('&', '').split('dM');
            return this.setResponse(message, false, numbers, secret, 'max');
        }
        
        if (message.match(/^[!&]{1}\d{1,2}d\d{1,3}([-+]\d{1,3})*/)) {
            numbers = message.replace('!', '').replace('&', '').split('d');
            return this.setResponse(message, false, numbers, secret, null);
        }
        
        if (message.match(/^[!&]{1}\d{1,2}D\d{1,3}([-+]\d{1,3})*/)) {
            numbers = message.replace('!', '').replace('&', '').split('D');
            return this.setResponse(message, true, numbers, secret, null);
        }
        
        return this.setResponse(message, false);
    }
}

module.exports = dice;