const DateHelper = () => { };

DateHelper.checkDate = (dob) => {
    const validatePattern = /^[0-9]{4}[-]{1}[0-9]{2}[-]{1}[0-9]{2}$/;
    if (!validatePattern.test(dob)) {
        return false
    }
    else {
        const date = dob.split('-');
        const year = parseInt(date[0]);
        const month = parseInt(date[1]);
        const day = parseInt(date[2]);
        if (month < 1 || month > 12) {
            return false;
        }
        else {
            if (day < 1 || day > 31) {
                return false;
            }
            else {
                if ((month === 4 || month === 6 || month === 9 || month === 11) && day == 31) {
                    return false
                }
                else {
                    if (month === 2) {
                        const isLeap = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
                        if (day > 29 || (day === 29 && !isLeap)) {
                            return false
                        }
                    }
                }
            }
        }

    }
    return true;
}

module.exports = DateHelper;