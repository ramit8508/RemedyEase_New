class Apierror extends error{
    constructor(
        statuscode,
        message = "Something went wrong",
        stack = "",
        errors = [],
    ){
        super(message);
        this.statuscode = statuscode;
        this.date = null ,
        this.message = message,
        this.errors = errors,
        this.success = false;
        if(stack){
            this.stack = stack;
        }else
        Error.captureStackTrace(this,this.constructor);
    }
}

export { Apierror };