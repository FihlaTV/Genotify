(function() {
    document.addEventListener('DOMContentLoaded', function(event) {
        console.log('DOM fully loaded.');
        document.getElementById('searchButton').addEventListener('click', newQuery);
        document.getElementById('query').addEventListener('keypress', function(e) {
            var key = e.which || e.keyCode;
            if (key === 13) {
                newQuery()
            }
        });
    });

    function newQuery() {
        var term = document.getElementById('query').value;
        var queryUrl = 'https://mygene.info/v3/query?q=' + term;
        var speciesOptions = document.getElementById('species');

        if (speciesOptions.selectedIndex !== -1) {
            var species = speciesOptions.options[speciesOptions.selectedIndex].value;
            queryUrl = 'https://mygene.info/v3/query?q=' + term + '&species=' + species;
        }

        fetch(queryUrl)
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' +
                            response.status);
                        return;
                    }

                    response.json().then(function(data) {
                        if (data.total !== 0 && data.success !== false) {
                            topHit = data.hits[0]
                            var basics = { 'geneSymbol': topHit.symbol, 'geneName': topHit.name, 'geneId': {'db': 'https://www.ncbi.nlm.nih.gov/gene/', 'ident': topHit._id}, 'matchScore': topHit._score, 'hits': data.hits.length };
                            displayData(basics)
                            annotateGene(topHit._id);
                        } else {
                            var empty = { 'hits': 'No hits', 'matchScore': '0' };
                            displayData(empty)
                            hideData(document.getElementById('infoDiv'));
                            hideData(document.getElementById('locDiv'));
                            hideData(document.getElementById('summaryDiv'));
                        }
                    });
                }
            )
            .catch(function(err) {
                console.error('Fetch Query Error', err);
            });
    }

    function displayData(dataArray) {
        for (data in dataArray) {
            currentData = document.getElementById(data);
            currentData.classList.remove('hidden');
            currentLabel = document.getElementById(data + 'Label');
            currentLabel.classList.remove('hidden');
            // Add new/remove old links from appropriate divs.
            if (currentData.classList.contains('addlink')) {
                var oldLinks = currentData.getElementsByTagName('a');
                while (oldLinks.length > 0) {
                    oldLinks[0].parentNode.removeChild(oldLinks[0]);
                }
                var linkData = dataArray[data];
                var link = linkData['db'] + linkData['ident'];
                var aTag = document.createElement('a');
                aTag.setAttribute('href', link);
                aTag.textContent = linkData['ident'];
                currentData.appendChild(aTag);
            } else {
                currentData.textContent = dataArray[data];
            }
        }
    }

    function hideData(divObj) {
        // Hide all data in child nodes of givin div element.
        var labels = divObj.querySelectorAll("label");
        var links = divObj.querySelectorAll('a');
        var i;
        var textDivs = divObj.getElementsByClassName("text");

        for (i = 0; i < labels.length; i++) {
            var childData = labels[i];

            if (!(childData.classList.contains('hidden'))) {
                childData.classList.add('hidden');
            }
        }

        for (i = 0; i < textDivs.length; i++) {
            var childData = textDivs[i];

            if (!(childData.classList.contains('hidden'))) {
                childData.classList.add('hidden');
                childData.textContent = '';
            }
        }

        for (i = 0; i < links.length; i++) {
            var childData = links[i];
            childData.remove();
        }
    }

    function annotateGene(gene) {
        fetch('https://mygene.info/v3/gene/' + gene)
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' +
                            response.status);
                        return;
                    }

                    // Examine the text in the response
                    response.json().then(function(data) {
                        console.log(data)
                        var info = { 'summary': data.summary, 'alias': data.alias.join(', '), 'hgncId': { 'db': 'https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=', 'ident': data.HGNC } };
                        displayData(info);
                    });
                }
            )
            .catch(function(err) {
                console.error('Fetch Gene Annotation Error', err);
            });
    }
})();