$(document).ready(function(){

	if (typeof FileActions !== 'undefined') {
		// Add versions button to 'files/index.php'
		FileActions.register(
			'file'
			, t('files_versions', 'Versions')
			, OC.PERMISSION_UPDATE
			, function() {
				// Specify icon for hitory button
				return OC.imagePath('core','actions/history');
			}
			,function(filename){
				// Action to perform when clicked
				if (scanFiles.scanning){return;}//workaround to prevent additional http request block scanning feedback

				var file = $('#dir').val()+'/'+filename;
				var createDropDown = true;
				// Check if drop down is already visible for a different file
				if (($('#dropdown').length > 0) ) {
					if ( $('#dropdown').hasClass('drop-versions') && file == $('#dropdown').data('file')) {
						createDropDown = false;
					}
					$('#dropdown').remove();
				}

				if(createDropDown === true) {
					createVersionsDropdown(filename, file);
				}
			}
		);
	}

	$(document).on("click", 'span[class="revertVersion"]', function() {
		console.log("click");
		var revision = $(this).attr('id');
		var file = $(this).attr('value');
		revertFile(file, revision);
	});

});

function revertFile(file, revision) {

	$.ajax({
		type: 'GET',
		url: OC.linkTo('files_versions', 'ajax/rollbackVersion.php'),
		dataType: 'json',
		data: {file: file, revision: revision},
		async: false,
		success: function(response) {
			if (response.status === 'error') {
				OC.Notification.show( t('files_version', 'Failed to revert {file} to revision {timestamp}.', {file:file, timestamp:formatDate(revision * 1000)}) );
			} else {
				$('#dropdown').hide('blind', function() {
					$('#dropdown').remove();
					$('tr').removeClass('mouseOver');
					// TODO also update the modified time in the web ui
				});
			}
		}
	});

}

function goToVersionPage(url){
	window.location.assign(url);
}

function createVersionsDropdown(filename, files) {

	var start = 0;

	var html = '<div id="dropdown" class="drop drop-versions" data-file="'+escapeHTML(files)+'">';
	html += '<div id="private">';
	html += '<ul id="found_versions">';
	html += '</ul>';
	html += '</div>';
	html += '<input type="hidden" value="'+ t('files_versions', 'More versions...') + '" name="makelink" id="makelink" />';

	if (filename) {
		$('tr').filterAttr('data-file',filename).addClass('mouseOver');
		$(html).appendTo($('tr').filterAttr('data-file',filename).find('td.filename'));
	} else {
		$(html).appendTo($('thead .share'));
	}

	getVersions(start);
	start = start + 5;

	$("#makelink").click(function() {
		//get more versions
		getVersions(start);
		start = start + 5;
	});

	function getVersions(start) {
		$.ajax({
			type: 'GET',
			url: OC.filePath('files_versions', 'ajax', 'getVersions.php'),
			dataType: 'json',
			data: {source: files, start: start},
			async: false,
			success: function(result) {
				var versions = result.data.versions;
				if (result.data.endReached === true) {
					document.getElementById("makelink").type="hidden";
				} else {
					document.getElementById("makelink").type="button";
				}
				if (versions) {
					$.each(versions, function(index, row) {
						addVersion(row);
					});
				} else {
					$('<div style="text-align:center;">'+ t('files_versions', 'No other versions available') + '</div>').appendTo('#dropdown');
				}
				$('#found_versions').change(function() {
					var revision = parseInt($(this).val());
					revertFile(files, revision);
				});
			}
		});
	}

	function addVersion( revision ) {
		title = formatDate(revision.version*1000);
		name ='<span class="versionDate" title="' + title + '">' + revision.humanReadableTimestamp + '</span>';

		path = OC.filePath('files_versions', '', 'download.php');

		download ='<a href="' + path + "?file=" + files + '&revision=' + revision.version + '">';
		download+=name;
		download+='<img';
		download+=' src="' + OC.imagePath('core', 'actions/download') + '"';
		download+=' id="' + revision.version + '"';
		download+=' value="' + files + '"';
		download+=' name="downloadVersion"';
		download+='/></a>';

		revert='<span class="revertVersion"';
		revert+=' id="' + revision.version + '"';
		revert+=' value="' + files + '">';
		revert+='<img';
		revert+=' src="' + OC.imagePath('core', 'actions/history') + '"';
		revert+=' id="' + revision.version + '"';
		revert+=' value="' + files + '"';
		revert+=' name="revertVersion"';
		revert+='/>'+t('files_versions', 'Revert')+'</span>';

		var version=$('<li/>');
		version.attr('value', revision.version);
		version.html(download + revert);

		version.appendTo('#found_versions');
	}

	$('tr').filterAttr('data-file',filename).addClass('mouseOver');
	$('#dropdown').show('blind');


}

$(this).click(
	function(event) {
	if ($('#dropdown').has(event.target).length === 0 && $('#dropdown').hasClass('drop-versions')) {
		$('#dropdown').hide('blind', function() {
			$('#dropdown').remove();
			$('tr').removeClass('mouseOver');
		});
	}


	}
);
