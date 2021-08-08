import dotenv from 'dotenv'
import e from 'express';
import { FormInputter } from './Inputter.js';
dotenv.config()
class Form{
    constructor({title,forms,child,id,max}){
        this.forms = forms
        this.child = child
        this.title = title
        this.id = id;
        this.max = max?max:5;
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

    addInputForm({name,isMandatory,value,placeholder,title,information,smallName,isSeparator=false}){
        this.forms.push(new Input({name,isMandatory,value,placeholder,title,information,smallName,isSeparator}))
    }

    addDropdownForm({name,isMandatory,value,options,title,information,smallName,isSeparator=false}){
        this.forms.push(new Dropdown({name,isMandatory,value,options,title,information,smallName,isSeparator}))
    }

    addAddInput(addInput){
        this.forms.push(addInput);
    }

    renderForm(answer){
        let forms = this.forms
        this.forms = []
        if(this.child){
            var addInput = new AddInput({name:"keluarga.title",isMandatory:true,value:"Keluarga",title:"Title",smallName:"Title",childs:[],information:"*This is Custom Input"})
            let custom = new CustomInput({
                name: "test",
                isMandatory: true,
                childs: [],
                title: "Test Field"
            },12);
            custom.addChild(new Input({name:"keluarga.nama[]",isMandatory:true,value:"",placeholder:"Nama Keluarga",title:"Nama Keluarga",size:8}))
            custom.addChild(new Link({link:"/form/"+this.child+"?",size:4}))
            addInput.addChild(custom);
            this.forms.push(addInput)
        }
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

    getInputHtml(isSee,{before,until}){
        var html = ""
        for(var i = before ; i<=until;i++){
            if(isSee){
                html += this.forms[i].generateSeeForm()
            }else{
                html += this.forms[i].generateForm(i+1)
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

    getPages(pagination){
        var pages = 1;
        var before = 0;
        var until = -1;
        var isMissing = true;
        for(var i = 0 ; i < this.forms.length ; i++){
            if(this.forms[i].isSeparator){
                pages++;
                isMissing = false;
                if(pagination){
                    before = until+1
                    until = i;
                    pagination--;
                }
            }
        }
        if (pagination){
            before = until+1;
            until = this.forms.length-1;
        }
        return {
            maxPagination:pages,
            before:before,
            until:until
        };
    }

    prevNext(pagination,child,{maxPagination}){
        // var pages = Math.ceil(this.forms.length / this.max);
        var pages = maxPagination;
        return `
        <div class="row">
        <div class="col-6">
            ${pagination > 1 ? '<button type="button" class="btn btn-primary" onclick="prev()">Prev</button>':''}
            ${child ? '<button type="button" class="btn btn-danger" onclick="closemsg()">Close</button>':''}
            </div>
            <div class="col-6" style='text-align:right;'>
            ${child && pagination == pages ? '<button type="button" class="btn btn-success" onclick="savemsg()">Save</button>':''}
            ${pagination < pages ? '<button type="button" onclick="next()" class="btn btn-primary">Next</button>':''}
        </div>
        </div>
        `
    }

    generateForm(isSee,{pagination,child}){
        var pagination = pagination?pagination:1;
        console.log(pagination,child)
        var data = this.getPages(pagination);
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
            var html = el.nextElementSibling.nextElementSibling.cloneNode(true)
            var parent = el.parentElement
            html.firstElementChild.innerHTML += '<div class="btn btn-danger" style="width:32px;height:58px;margin-top:-22px;display:inline-block" onclick=del(this)>-</div>'
            parent.appendChild(html)
        }
        var param;
        $( document ).ready(function() {
            window.localStorage.removeItem("forms${this.id}")
            save();
            load();
            window.addEventListener("message", (event) => {
                if(event.data.command == 1){
                    let data = getData();
                    console.log(data);
                    if(!data[0].child){
                        data[0].child = [];
                    }
                    data[0].child[event.data.payload[0].counter]=(event.data.payload)
                    window.localStorage.setItem("forms${this.id}",JSON.stringify(data))
                }else if(event.data.command==2){
                    var dt = getData();
                    var det = saveByKeys(dt[0],event.data.payload);
                    window.localStorage.setItem("forms${this.id}",JSON.stringify(dt));
                    console.log(dt,JSON.stringify(dt))
                }
            }, false);
        })
                function getParameterByName(name) {
                    return getParam().get(name)*1
                }
                function getParam(){
                    if(!param) param = new URLSearchParams(location.search)
                    return param
                }
                function next(){
                    save()
                    if(getParameterByName('pagination')){
                        getParam().set('pagination',getParameterByName('pagination')*1+1);
                    }else{
                        getParam().set('pagination',2);
                    }
                    window.location.href = window.location.href.split('?')[0]+"?"+getParam().toString();
                    console.log(window.location.href.split('?')[0]+"?"+getParam().toString())
                }
                function prev(){
                    save()
                    getParam().set('pagination',getParameterByName('pagination')*1-1);
                    window.location.href = window.location.href.split('?')[0]+"?"+getParam().toString();
                }
                function getData(){
                    var data = JSON.parse(window.localStorage.getItem("forms${this.id}"));
                    return data;
                }
                function save(){
                    var data = [];
                    if(getData()){
                        data = getData();
                    }
                    var pg  = getParameterByName('pagination');
                    pg = pg?pg:1;
                    data[pg-1] = saveByKeys(data[pg-1],getPair());
                    window.localStorage.setItem("forms${this.id}",JSON.stringify(data))
                }
                function saveByKeys(sv,obj){
                    if(!sv){
                        sv = {};
                    }
                    Object.keys(obj).forEach((value) => {
                        sv[value] = obj[value];
                    })
                    return sv;
                }
                function closemsg(){
                    console.log("close");
                    window.localStorage.removeItem("forms${this.id}")
                    var win = window.open("about:blank", "_self");
                    win.close();
                }
                function savemsg(){
                    save();
                    window.opener.postMessage({payload:getData(),command:1})
                    closemsg();
                }
                function load(){
                    let idx = getParameterByName('pagination')-1;
                    let data = getData();
                    if(!data) return;
                    data = data[idx];
                    if(data){
                        Object.keys(data).forEach((key,index) => {
                            if(key.indexOf("[]") != -1){
                                var elements = $("input[name='"+key+"'],select[name='"+key+"']");
                                var loop = data[key].length - elements.length
                                let addButton = $(elements[0].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement).find(".btn-success");
                                while(loop--){
                                    addButton.click();
                                }
                                elements = $("input[name='"+key+"'],select[name='"+key+"']");
                                elements.each((index,element) => {
                                    element.value = data[key][index];
                                    console.log(element);
                                })
                            }else{
                                $("input[name='"+key+"'],select[name='"+key+"']").val(data[key]);
                            }
                        })
                        
                        console.log(data)
                    }
                }
                function del(el){
                    el.parentElement.parentElement.remove()
                }
                function getPair(){
                var form = document.getElementsByTagName("form");
                var inputs = form[0].querySelectorAll("input,select");
                
                var formData = {};
                for(var i=0; i< inputs.length; i++){
                    // var strs = inputs[i].name.split(".");
                    // if(strs.length > 1){
                        // if(!formData[strs[0]]){
                            //     formData[strs[0]] = {};
                            // }
                            // var count = strs[1].indexOf("[]");
                            var count = inputs[i].name.indexOf("[]");
                            // var name = strs[1].substr(0,count);
                            var name = inputs[i].name;
                            if(count != -1){
                                if(formData[name]==null){
                                    formData[name] = []
                                }
                                formData[name].push(inputs[i].value);
                            }else{
                                formData[inputs[i].name] = inputs[i].value;
                            }
                            // }else{
                                //     formData[inputs[i].name] = inputs[i].value;
                                // }
                            }
                            return (formData);
                        }
            function flat(array){
                var obj = {};
                for(var i = 0 ; i < array.length;i++){
                    Object.entries(array[i]).forEach(entry => {
                        const [key, value] = entry;
                        if (key in obj){
                            if(!Array.isArray(obj[key])){
                                var temp = obj[key]
                                obj[key] = [temp]
                            }else{
                                obj[key].push(value);
                            }
                        }else{
                            obj[key] = value
                        }
                    });
                }
                return obj
            }
            function getResult(){
                save();
                var form = document.getElementsByTagName("form");
                var dt = getData();
                if(dt[0]["child"]){
                    for(var i = 0 ; i < dt[0].child.length;i++){
                        dt[0].child[i] = flat(dt[0].child[i]);
                    }
                }
                dt = flat(dt);
                var formdata = ({url:$(form).attr('action'),data:dt,formId:${this.id}});
                return formdata;
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
        ${this.getInputHtml(isSee,data)}
        </div>
        ${this.prevNext(pagination,child,data)}
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
    static LINK = 8;
    static idCounter = 1;
    static map = {
        1:"Input",
        2:"Dropdown",
        3:"RadioButton",
        5:"AddInput",
        7:"CustomInput",
        8:"Link"
    }

    constructor({type,name,title,isMandatory,value,size = 6,information="",isSeparator=false,smallName=""}){
        this.isMandatory = isMandatory
        this.type = type
        this.name = name
        this.smallName = smallName;
        this.value = value
        this.title = title
        this.size = size;
        this.information = information;
        this.isSeparator = isSeparator;
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

    generateForm(counter){
        return this.outerForm(this.input(),counter)
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

    outerForm(inner,counter = 1,isOpen = true){
        return `
            <div class="col-md-${this.size} col-xs-12">
            ${isOpen?`<p><b>${counter}. ${this.smallName}</b></p>`:``}
            <div class="form-floating" style="height:100%;">
                ${inner}
            </div>
            </div>
        `
    }

    info(){
        return `
        <div class="">
            ${this.information}
        </div>
        `
    }
}

class Input extends BasicInput{
    constructor({name,isMandatory,value,placeholder,title,size=6,information,smallName,isSeparator=false}){
        super({isMandatory,type:BasicInput.INPUT,name,value,title,size,information,smallName,isSeparator})
        this.placeholder = placeholder
    }

    getPlaceholder(){
        return this.getStringValue(this.placeholder)
    }

    input(){
        return `
            <input type='text' name="${this.name}" ${this.style} class="form-control" id="${this.getIdentifier()}" value=${this.getValue()} ${this.getRequiredText("required")} placholder=${this.getPlaceholder()}/>
            ${this.inputHeader()}
            ${this.info()}
        `
    }
}

class Link extends BasicInput{
    constructor({name,size=6,information,smallName,isSeparator=false,link}){
        super({name,type:BasicInput.LINK,size,information,smallName,isSeparator})
        this.link = link;
    }

    getPlaceholder(){
        return this.getStringValue(this.placeholder)
    }

    input(){
        return `
            <Button name=${this.name} data-counter=0 style="width:100%;height:100%;" class="btn btn-primary" onclick="
            let popup = window.open('${this.link}child=true&counter=0');
            console.log(this.dataset.counter);
            var dt = getData()[0].child;
            if(dt && dt.length > 0){
                popup.addEventListener('load', () => {
                    popup.postMessage({
                        command:2,
                        payload: {...dt[this.dataset.counter],counter:this.dataset.counter}
                    });
                }, true); 
            }else{
                popup.addEventListener('load', () => {
                    popup.postMessage({
                        command:2,
                        payload: {counter:this.dataset.counter}
                    });
                }, true); 
            }
            "
            type='Button' class="form-control" id="${this.getIdentifier()}">Open</Button>
        `
    }
}

class Dropdown extends BasicInput{
    constructor({name,isMandatory,title,value,options,size = 6,information,smallName,isSeparator=false}){   
        super({isMandatory,type:BasicInput.DROPDOWN,name,value,title,size,information,smallName,isSeparator})
        this.options = options
    }

    input(){
        return `
            <select class="form-select" name="${this.name}" ${this.getRequiredText("required")} id="${this.getIdentifier()}">
                ${this.optionHTML()}
            </select>
            ${this.inputHeader()}
            ${this.info()}
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
    constructor({name,isMandatory,title,value,options,information,smallName,isSeparator=false}){   
        super({isMandatory,type:BasicInput.DROPDOWN,name,value,title,smallName,isSeparator})
        this.options = options
    }

    input(){
        return `
            <select class="form-control"  name="${this.name}" ${this.getRequiredText("required")} id="${this.getIdentifier()}">
                ${this.optionHTML()}
            </select>
            ${this.inputHeader()}
            ${this.info()}
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
        return string + this.info();
    }
}
class AddInput extends BasicInput{
    constructor({name,isMandatory,value,childs,title,information,smallName,isSeparator=false}){
        super({isMandatory,type:BasicInput.ADD_INPUT,name,value,title,information,size:6,smallName,isSeparator})
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
            string += this.childs[i].outerForm(elstring,0,false)
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
            ${this.info()}
            ${this.getChilds()}
        `
    }
    outerForm(inner,counter = 1 , isOpen = true){
        return `
            <div class="col-md-${this.size} col-xs-12">
                ${isOpen?`<p><b>${counter}. ${this.smallName}</b></p>`:``}
                ${inner}
            </div>
        `
    }
    addChild(child){
        this.childs.push(child)
    }
}

class CustomInput extends BasicInput{
    constructor({name,isMandatory,value,childs,title,size = 12,information,smallName,isSeparator=false}){
        super({isMandatory,type:BasicInput.CUSTOM_INPUT,name,value,title,size,information,smallName,isSeparator})
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
            <div class="form-floating" style="height:100%;">
                ${child.input()}
                ${this.info()}
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
