// this function takes the question object returned by the StackOverflow request
// and returns new result to be appended to DOM
var showQuestion = function(question) {

	// create a data object with all the formatted data that we want to insert
	// into our template
	var data = {
		title: question.title,
		link: question.link,
		date: new Date(1000*question.creation_date).toString(),
		viewCount: question.view_count,
		asker:  '<p>Name: <a target="_blank" '+
						'href=http://stackoverflow.com/users/' + question.owner.user_id + ' >' +
						question.owner.display_name +
						'</a></p>' +
						'<p>Reputation: ' + question.owner.reputation + '</p>'
	};

	// Insert the data into our template and pass the result (a cloned and
	// populated template) on to be inserted in the DOM
	var result = insertIntoTemplate('question', data);

	return result;
};

// this function takes the user object returned by the StackOverflow request
// and returns new result to be appended to DOM
var showAnswerer = function(answerer) {

	// create a data object with all the formatted data that we want to insert
	// into our template
	var data = {
		name: answerer.user.display_name,
		link: answerer.user.link,
		reputation: answerer.user.reputation,
		postCount: answerer.post_count,
		score: answerer.score
	};

	// Insert the data into our template and pass the result (a cloned and
	// populated template) on to be inserted in the DOM
	var result = insertIntoTemplate('answerers', data);

	return result;
};

// Clone and populate a template from the DOM. Populating the template is done
// by looking for template tags. In this case, template tags are found by
// looking for a unique prefix: @data. Assume that the string that follows
// correlates to a property within data. If that turns out to be the case,
// insert the property into the template.
var insertIntoTemplate = function(templateClass, data) {
  var prefix = '@data.';

	// clone our result template code
	var result = $('.templates .' + templateClass).clone();

	// Iterate through every element that's within 'result'
	$('*', result).each(function() {
		// initialize 'property' so that we're not defining it twice (once in each
	  // if block)
		var property;

		// Check the html content of this element for the template tag/prefix.
		// Note that we're using html() rather than text() so that we don't
		// get false positives on parent elements - $('.question-text').text()
		// would be the same as $('.question-text a').text() because .text()
		// filters out HTML tags... and that would result in the link being
		// overwritten by the title.
		if ( $(this).html().indexOf(prefix) > -1) {

			// The property should be the substring that follows the unique
			// template prefix, so we define that property by removing the
			// prefix from the element's html.
			property = $(this).html().replace(prefix, '');

			// If the property exists, insert it into the element
			if ( data.hasOwnProperty(property) ) {
				$(this).html( data[property] );
			}
		}

		// Check the href attribute of this element for the template
		// tag/prefix, if there is one. Effectively the same code as above.
		var elementLink = $(this).attr('href');
		if ( elementLink && elementLink.indexOf(prefix) > -1) {
			property = elementLink.replace(prefix, '');
			if ( data.hasOwnProperty(property) ) {
				$(this).attr('href', data[property] );
			}
		}

	});

	return result;
};

// this function takes the results object from StackOverflow
// and returns the number of results and tags to be appended to DOM
var showSearchResults = function(query, resultNum) {
	var results = resultNum + ' results for <strong>' + query + '</strong>';
	return results;
};

// takes error string and turns it into displayable DOM element
var showError = function(error){
	var errorElem = $('.templates .error').clone();
	var errorText = '<p>' + error + '</p>';
	errorElem.append(errorText);
};

// Make an AJAX request at the specified URL for the specified tag, and
// execute the generateResult function on each result item.
var getSomething = function(tag, url, generateResult) {
	// the parameters we need to pass in our request to StackOverflow's API
	var request = {
    tagged: tag,
    site: 'stackoverflow',
    order: 'desc',
    sort: 'creation'
	};

	$.ajax({
		url: url,
		data: request,
		dataType: "jsonp", //use jsonp to avoid cross origin issues
		type: "GET",
	})
  .done(function(result){ //this waits for the ajax to return with a succesful promise object
		var searchResults = showSearchResults(request.tagged, result.items.length);
		$('.search-results').html(searchResults);
		//$.each is a higher order function. It takes an array and a function as an argument.
		//The function is executed once for each item in the array.
		$.each(result.items, function(i, item) {
			var result = generateResult(item);
			$('.results').append(result);
		});
	})
	.fail(function(jqXHR, error){ //this waits for the ajax to return with an error promise object
		var errorElem = showError(error);
		$('.search-results').append(errorElem);
	});
};


$(function() {
	$('.unanswered-getter').submit( function(e){
		e.preventDefault();
		// zero out results if previous search has run
		$('.results').html('');
		// get the value of the tags the user submitted
		var tags = $(this).find("input[name='tags']").val();
		var url = "http://api.stackexchange.com/2.2/questions/unanswered";
		getSomething(tags, url, showQuestion);
	});
	$('.inspiration-getter').submit(function(e) {
  	e.preventDefault();
  	// zero out results if prefious search has run
  	$('.results').html('');
  	// get the value of the tags the user submitted
  	var tag = $(this).find("input[name='answerers']").val();
		var url = "http://api.stackexchange.com/2.2/tags/" + tag + "/top-answerers/all_time";
  	getSomething(tag, url, showAnswerer);
  });
});
