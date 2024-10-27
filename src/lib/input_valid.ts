export function inputValid(event:InputEvent, min:number, max:number, bindableValue:object, maxDecimals:number) {
    let value = event.target.value;
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
        const decimalPart = value.split(".")[1];
        if (decimalPart && decimalPart.length > maxDecimals) {
            value = parseFloat(value).toFixed(maxDecimals);
        }
        
        bindableValue.set(value);
        
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            if (numericValue > max) {
                bindableValue.set(max.toFixed(maxDecimals));
            } else if (numericValue < min) {
                bindableValue.set(min.toFixed(maxDecimals));
            }
        }
    }
}