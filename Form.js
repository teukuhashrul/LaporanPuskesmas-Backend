import dotenv from 'dotenv'
import e from 'express';
import { FormInputter } from './Inputter.js';
dotenv.config()
class Form{
    constructor({title,forms,id}){
        this.forms = forms
        this.title = title
        this.id = id;
        this.renderForm()
    }

    static async getForm(id){
        return FormInputter.get(id).then((rows) => {
            return new Form(rows[0]);
        })
    }

    static async getUserForm(id){
        let participantQuery = await ParticipantInputter.get(id)
        let participant = participantQuery.rows[0]
        let formQuery = await FormInputter.get(participant.form_id)
        let form = formQuery.rows[0]
        let formHTML = new Form(form)
        formHTML.renderForm(participant.answer)
        return formHTML
    }

    addInputForm({name,isMandatory,value,placeholder,title}){
        this.forms.push(new Input({name,isMandatory,value,placeholder,title}))
    }

    addDropdownForm({name,isMandatory,value,options,title}){
        this.forms.push(new Dropdown({name,isMandatory,value,options,title}))
    }

    addAddInput(addInput){
        this.forms.push(addInput);
    }

    renderForm(answer){
        let forms = this.forms
        this.forms = []
        for(var i = 0 ; i < forms.length; i++){
            if(answer){
                forms[i].value = answer[forms[i].name]
            }
            this.forms.push(this.readForm(forms[i]))
        }
    }

    readForm(form){
        return eval(`new ${BasicInput.map[form.type]}(${JSON.stringify(form)})`)
    }

    getInputHtml(isSee){
        var html = ""
        for(var i = 0 ; i<this.forms.length;i++){
            if(isSee){
                html += this.forms[i].generateSeeForm()
            }else{
                html += this.forms[i].generateForm()
            }
        }
        return html
    }

    generateSubmitButton(isSee){
        if(isSee){
            return ""
        }else{
            return `
                <div style="text-align:center" class="col-md-12">
                    <input type="submit" class="btn btn-primary p-2 w-100"  value="Submit"/>
                </div>
            `
        }
    }

    generateForm(isSee){
        return `
        <!doctype html>
        <html lang="en" style="height:100vh">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <!-- Bootstrap CSS -->
        </head>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous">
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js" integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossorigin="anonymous"></script>

        <title>Kader Puskesmas!</title>
        <script>
            function add(el){
                var html = el.nextElementSibling.cloneNode(true)
                var parent = el.parentElement
                html.firstElementChild.innerHTML += '<div class="btn btn-danger" style="width:32px;height:58px;margin-top:-22px;display:inline-block" onclick=del(this)>-</div>'
                parent.appendChild(html)
            }
            function del(el){
                el.parentElement.parentElement.remove()
            }
            function getPair(){
                var form = document.getElementsByTagName("form");
                var inputs = form[0].getElementsByTagName("input");

                var formData = {};
                for(var i=0; i< inputs.length; i++){
                    var count = inputs[i].name.indexOf("[]");
                    var name = inputs[i].name.substr(0,count);
                    if(count != -1){
                        if(formData[name]==null){
                            formData[name] = []
                        }
                        formData[name].push(inputs[i].value);
                    }else{
                        formData[inputs[i].name] = inputs[i].value;
                    }
                }
                var formdata = ({url:$(form).attr('action'),data:formData});
                return (formdata);
            }
        </script>
        <style>
            .decrease{
                width: calc(100% - 50px);
                display: inline-block;
            }
        </style>
        <body style="height:100%">
        <form action="${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}/submit-form/${this.id}" method="post" style="margin:0px !important;height:100%">

        <div class="container p-4" style="background-color:#fcfcfc;height:100%">
            <h2 class="mb-4">${this.title}</h2>
            <div class="row pb-4 g-2">
            ${this.getInputHtml(isSee)}  
            </div>
            </div>
            </form>
            </body>
            </html>
            `
        }
        
    }
// ${this.generateSubmitButton(isSee)}

class BasicInput{
    static INPUT = 1
    static DROPDOWN = 2
    static RADIO_BUTTON = 3
    static DATE = 4
    static ADD_INPUT = 5;
    static INLINE_INPUT = 6;
    static CUSTOM_INPUT = 7;
    static idCounter = 1;
    static map = {
        1:"Input",
        2:"Dropdown",
        3:"RadioButton",
        5:"AddInput",
        7:"CustomInput"
    }

    constructor({type,name,title,isMandatory,value,size = 6}){
        this.isMandatory = isMandatory
        this.type = type
        this.name = name
        this.value = value
        this.title = title
        this.size = size;
        this.id = BasicInput.idCounter++
    }

    getStringValue(value){
        if(value){
            return `"${value}"`
        }else{
            return `""`
        }
    }

    getValue(){
        return this.getStringValue(this.value)
    }

    generateForm(){
        return this.outerForm(this.input())
    }

    generateSeeForm(){
        return this.outerForm(this.inputSee())
    }

    getIdentifier(){
        return `identifier-${this.id}`
    }

    input(){
        return "";
    }

    getRequiredText(text){
        if(this.isMandatory){
            return text
        }else{
            return ""
        }
    }

    inputHeader() {
        return `<label for='${this.getIdentifier()}'>${this.title} ${this.getRequiredText("*")}</label>`
    }

    inputSee(){
        return `
            <input type="text" name="${this.name}" value=${this.getValue()} class="form-control" id='${this.getIdentifier()}' disabled>
            ${this.inputHeader()}
        `
    }

    outerForm(inner){
        return `
            <div class="col-md-${this.size} col-xs-12">
            <div class="form-floating">
                ${inner}
            </div>
            </div>
        `
    }
}

class Input extends BasicInput{
    constructor({name,isMandatory,value,placeholder,title,size=6}){
        super({isMandatory,type:BasicInput.INPUT,name,value,title,size})
        this.placeholder = placeholder
    }

    getPlaceholder(){
        return this.getStringValue(this.placeholder)
    }

    input(){
        return `
            <input type='text' name="${this.name}" ${this.style} class="form-control" id="${this.getIdentifier()}" value=${this.getValue()} ${this.getRequiredText("required")} placholder=${this.getPlaceholder()}/>
            ${this.inputHeader()}
        `
    }
}

class Dropdown extends BasicInput{
    constructor({name,isMandatory,title,value,options,size = 6}){   
        super({isMandatory,type:BasicInput.DROPDOWN,name,value,title,size})
        this.options = options
    }

    input(){
        return `
            <select class="form-select" name="${this.name}" ${this.getRequiredText("required")} id="${this.getIdentifier()}">
                ${this.optionHTML()}
            </select>
            ${this.inputHeader()}
        `
    }

    optionHTML(){
        var string = ""
        if(this.options){
            for(var i = 0; i < this.options.length; i++){
                var option = this.options[i]
                string += `<option ${option.value == this.value?"selected":""} value="${option.value}">${option.name}</option>\n`
            }
        }
        return string
    }
}

class RadioButton extends BasicInput{
    constructor({name,isMandatory,title,value,options}){   
        super({isMandatory,type:BasicInput.DROPDOWN,name,value,title})
        this.options = options
    }

    input(){
        return `
            <select class="form-control"  name="${this.name}" ${this.getRequiredText("required")} id="${this.getIdentifier()}">
                ${this.optionHTML()}
            </select>
            ${this.inputHeader()}
        `
    }

    optionHTML(){
        var string = ""
        if(this.options){
            for(var i = 0; i < this.options.length; i++){
                var option = this.options[i]
                string += `<option ${option.value == this.value?"selected":""} value="${option.value}">${option.name}</option>\n`
            }
        }
        return string
    }
}
class AddInput extends BasicInput{
    constructor({name,isMandatory,value,childs,title}){
        super({isMandatory,type:BasicInput.ADD_INPUT,name,value,title},6)
        this.childs = [];
        for(var i = 0 ; i < childs.length; i++){
            this.childs.push(eval(`new ${BasicInput.map[childs[i].type]}(${JSON.stringify(childs[i])})`))
        }
    }
    getChilds(){
        var string = "";
        for(var i = 0 ; i < this.childs.length; i++){
            var elstring = "<div class='mt-2 decrease'>"
            elstring += this.childs[i].input()
            elstring += "</div>"
            if(i != 0){
                elstring += `<div class="btn btn-danger" style="width:32px;height:58px;margin-top:-22px;display:inline-block" onclick=del(this)>-</div>`
            }
            string += this.childs[i].outerForm(elstring)
        }
        return string
    }
    input(){
        return `
            <div class="form-floating decrease">
                <input type='text' disabled name="${this.name}" class="form-control" id="${this.getIdentifier()}" value=${this.getValue()} }/>
                ${this.inputHeader()}
            </div>
            <div class="btn btn-success" style="width:32px;height:58px;margin-top:-22px;display:inline-block" onclick=add(this)>+</div>
                ${this.getChilds()}
        `
    }
    outerForm(inner){
        return `
            <div class="col-md-${this.size} col-xs-12">
                ${inner}
            </div>
        `
    }
    addChild(child){
        this.childs.push(child)
    }
}

class CustomInput extends BasicInput{
    constructor({name,isMandatory,value,childs,title,size = 12}){
        super({isMandatory,type:BasicInput.CUSTOM_INPUT,name,value,title,size})
        this.childs = [];
        for(var i = 0 ; i < childs.length; i++){
            this.childs.push(eval(`new ${BasicInput.map[childs[i].type]}(${JSON.stringify(childs[i])})`))
        }
    }
    getChilds(){
        var string = "<div class='row' style=\"padding-left:12px;padding-right:12px\">";
        for(var i = 0 ; i < this.childs.length; i++){
            string += this.outerFormRow(this.childs[i])
        }
        return string+"</div>"
    }
    outerFormRow(child){
        return `
            <div class="col-md-${child.size} col-xs-12" style="padding:0px">
            <div class="form-floating">
                ${child.input()}
            </div>
            </div>
        `
    }
    input(){
        return `
            ${this.getChilds()}
        `
    }
    addChild(child){
        this.childs.push(child)
    }
}

export {CustomInput,AddInput,RadioButton,Dropdown,Input,BasicInput,Form}