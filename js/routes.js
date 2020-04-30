/*
 * Created by Stefan Korecko, 2020
 * routes definition and handling for paramHashRouter
 */


//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"addArticle",
        target:"router-view",
        getTemplate:addNewArticle

    },
    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
    },
    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"router-view",
        getTemplate: deleteArticle
    }

];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}

function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash){

    const offset=Number(offsetFromHash)-1;
    const totalCount=Number(totalCountFromHash);
    console.log("ja som total"+totalCount);

    let articleArray = [];

    let urlQuery = "";
    let size;

    if (offset && totalCount){
        urlQuery=`?offset=${offset}&max=${articlesPerPage}`;
    }else{
        urlQuery=`?max=${articlesPerPage}`;
    }
    const newUrl= urlBase+"/article"

    // const url = `${urlBase}/article${urlQuery}`;

    fetch(newUrl+urlQuery)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })

        .then(responseJSON=>{
            articleArray = responseJSON.articles;
            size= responseJSON.meta.totalCount;
            // addArtDetailLink2ResponseJson(responseJSON);
            return Promise.resolve();
        })

        .then(() => {
            let artRequests = articleArray.map(
                article => fetch(`${newUrl}/${article.id}/${urlQuery}`)
            );
            console.log("ja idem")
            return Promise.all(artRequests);
        })

        .then(responses => {
            let failed = "";
            for (let response of responses) {
                if (!response.ok) failed += response.url + " "
                console.log("ja ideem")
            }
            if (failed === ""){
                return responses;
            }else {
                return  Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))

        .then(articles => {
            articles.forEach((article,index) =>{
                articleArray[index].content=article.content;
            });
            return Promise.resolve();
        })

        .then( ()=> {
            console.log("cyklus");
            let text=[];
            let i;
            for(i=0; i<articleArray.length; i++) {
                text[i] = {
                    title: i+articleArray[i].title,
                    content: articleArray[i].content,
                    author: articleArray[i].author,
                }
            }
            console.log(text);
            f(targetElm,offsetFromHash,size,text);
            // addArtDetailLink2ResponseJson(responseJSON)
        })


        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
    }
    function addArtDetailLink2ResponseJson(responseJSON){
        responseJSON.articles =
            responseJSON.articles.map(
                article =>(
                    {
                        ...article,
                        detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                    }
                )
            );
        console.log(responseJSON.articles);
    }

function f(targetElm,current,totalCount,array) {
    current=Number(current);
    totalCount=Number(totalCount);
    console.log("to ja nejdem");

    const data4rendering={
        currPage:current,
        pageCount:totalCount,
        articles: array,
    };

    if(current>1){
        data4rendering.prevPage=current-articlesPerPage;
    }

    if(current+articlesPerPage<totalCount){
        data4rendering.nextPage=current+articlesPerPage;
    }
    console.log(data4rendering)
    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-articles").innerHTML,
        data4rendering
    );
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}


/**
 * Gets an article record from a server and processes it to html according to the value of the forEdit parameter.
 * Assumes existence of the urlBase global variable with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates with id="template-article" (if forEdit=false)
 * and id="template-article-form" (if forEdit=true).
 * @param targetElm - element to which the acquired article record will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                console.log("ja som true");
            }else{
                console.log("ja som false");
                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

}
function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}

function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON=>{
            deleteData(event,artIdFromHash,offsetFromHash,totalCountFromHash,urlBase);
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-article").innerHTML,
                    responseJSON
                );
            window.location=`#articles/${offsetFromHash}/${totalCountFromHash}`;
            fetchAndDisplayArticles(targetElm,offsetFromHash,totalCountFromHash);
        })
        .catch (error => {
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}

function addNewArticle(targetElm) {
    fetch(urlBase)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        // .then(responseJSON => {
        //     responseJSON.formTitle = "Article Add";
        //     console.log("ale ja idem")
        //     responseJSON.formSubmitCall =
        //         `processArtEditFrmData(event,'${urlBase}', 'POST')`;
        //     responseJSON.submitBtTitle = "Save article";
        //     responseJSON.urlBase = urlBase;
        //     const totalCount= responseJSON.meta.totalCount;
        //     const offset=Math.round(totalCount/articlesPerPage)+articlesPerPage;
        //
        //
        //     responseJSON.backLink = `#articles/${offset}/${totalCount}`;
        //
        //     document.getElementById(targetElm).innerHTML =
        //         Mustache.render(
        //             document.getElementById("template-article-form").innerHTML,
        //             responseJSON
        //         );
        // })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}
