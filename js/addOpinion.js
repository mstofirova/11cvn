/*
 * Created by Stefan Korecko, 2020
 * Form processing functionality
 */


function processOpnFrmData(event){
    //1.prevent normal event (form sending) processing
    event.preventDefault();

    //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
    const formName = document.getElementById("myForm").elements["name"].value.trim();
    const formEmail = document.getElementById("myForm").elements["email"].value.trim();
    const formUrl = document.getElementById("myForm").elements["url"].value.trim();
    const formText = document.getElementById("myForm").elements["textElm"].value.trim();
    const valueBook = document.getElementById("myForm").elements["question"].value;
    const tooManyBook1 = document.getElementById("myForm").elements["book50"].checked;
    const tooManyBook2 = document.getElementById("myForm").elements["bookTime"].checked;
    const tooManyBook3 = document.getElementById("myForm").elements["rates"].checked;

    //3. Verify the data
    if (formName == "" || formEmail == "" || formText == "") {
        window.alert("Please enter your name, email and comment");
        return;
    }

    //3. Add the data to the array opinions and local storage
    const newOpinion =
        {
            name: formName,
            email: formEmail,
            url: formUrl,
            comment: formText,
            created: new Date(Date.now()),
            loveBook: loveBookCheck(valueBook),
            manyBook1: tooManyBook1,
            manyBook2: tooManyBook2,
            manyBook3: tooManyBook3

        };


    let opinions = [];

    if(localStorage.myTreesComments){
        opinions=JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);


    //5. Go to the opinions
    window.location.hash="#opinions";

}
function loveBookCheck(value) {
    if (value == "1") {
        return "miluje knihy"
    } else if (value == "2") {
        return "ma rad/a knihy"
    } else {
        return "nema rad/a knihy"
    }
}
