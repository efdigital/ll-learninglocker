import catchErrors from 'api/controllers/utils/catchErrors';
import getAuthFromRequest from 'lib/helpers/getAuthFromRequest';
import getScopeFilter from 'lib/services/auth/filters/getScopeFilter';
import getOrgFromAuthInfo from 'lib/services/auth/authInfoSelectors/getOrgFromAuthInfo';
import Visualisation from 'lib/models/visualisation';
import { boolean } from 'boolean';
import _ from 'lodash';

const MODEL_NAME = 'visualisation';

/**
 * Delete a Visualisation by ID
 * Custom implementation to work around express-restify-mongoose 9.x scope filtering issues
 */
const deleteVisualisation = catchErrors(async (req, res) => {
  const authInfo = getAuthFromRequest(req);

  // Check user has delete permissions
  const scopeFilter = await getScopeFilter({
    modelName: MODEL_NAME,
    actionName: 'delete',
    authInfo
  });

  const { id } = req.params;
  const organisation = getOrgFromAuthInfo(authInfo);

  if (!id) {
    return res.status(400).json({
      error: 'Visualisation ID is required'
    });
  }

  try {
    // Build the full filter including scope filtering and soft deletes
    const baseQuery = [];
    if (Visualisation.schema.softDeletes) {
      const showTrashed = boolean(_.get(req, 'query.trashed', false));
      if (!showTrashed) {
        baseQuery.push({ deleted: { $ne: true } });
      }
    }

    const filter = { $and: [...baseQuery, scopeFilter, { _id: id }] };

    // Find the Visualisation first to ensure it exists and user has access
    const visualisation = await Visualisation.findOne(filter);

    if (!visualisation) {
      return res.status(404).json({
        error: 'Not Found'
      });
    }

    // Perform audit logging if configured
    if (visualisation.constructor.auditRemove) {
      visualisation.constructor.auditRemove(visualisation, req.user);
    }

    // Delete the Visualisation
    await Visualisation.deleteOne({ _id: id });

    // Return success response (204 No Content is standard for successful DELETE)
    return res.status(204).send();

  } catch (error) {
    console.error('Error deleting Visualisation:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting Visualisation'
    });
  }
});

export default {
  deleteVisualisation
};