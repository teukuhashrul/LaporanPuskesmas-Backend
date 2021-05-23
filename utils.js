export let removeDuplicateFromArrayNumber = (arr_number)=>{
    let newArray = []  ; 

    arr_number.map((item)=>{
        if(newArray.indexOf(item) === -1){
            newArray.push(item)
        }
    })

    return newArray; 
}
